import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { and, asc, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "./db";
import { exercises, sessions, setLogs, weightLogs, workouts } from "./schema";
import { upsertWorkout } from "./workouts";
import { DAYS } from "./days";
import catalog from "./exercise-catalog.json";

const json = (data: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] });
const fail = (msg: string) => ({ content: [{ type: "text" as const, text: msg }], isError: true });

const tz = "Asia/Jerusalem";
const fmtDate = (d: Date) =>
  new Intl.DateTimeFormat("sv-SE", { timeZone: tz, dateStyle: "short", timeStyle: "short" }).format(d);
const dayLabel = (d: number | null) => (d == null ? null : DAYS[d]);

const exerciseSchema = z.object({
  id: z.number().int().optional().describe("Existing exercise id (from list_workouts). Omit for new exercises; a row with the same name is matched automatically."),
  name: z.string().min(1).describe("Exercise name (Hebrew is fine)"),
  section: z.string().optional().describe("Section, e.g. חימום / חלק עיקרי / ליבה / סיום ומתיחות"),
  kind: z.enum(["sets", "check"]).optional().describe("'sets' = numbered sets with weight; 'check' = single checklist item (warm-up, stretch)"),
  sets: z.number().int().min(1).max(12).optional(),
  reps: z.string().optional().describe("Reps or time, e.g. '8–10', '40 שנ׳', '10 לכל צד'"),
  pair: z.string().optional().describe("Superset letter (A/B/C). Two consecutive exercises with the same letter are done alternately."),
  tip: z.string().optional().describe("Short cues, one per line (shown behind a \"דגשים\" button)"),
  default_weight: z.number().min(0).optional().describe("Starting weight in kg"),
  media_id: z.string().optional().describe("Demo id from search_exercise_demos"),
});

async function loadWorkouts(ids?: number[]) {
  const ws = await db()
    .select()
    .from(workouts)
    .where(ids ? inArray(workouts.id, ids) : eq(workouts.archived, false))
    .orderBy(sql`${workouts.dayOfWeek} is null`, asc(workouts.dayOfWeek), asc(workouts.id));
  if (!ws.length) return [];
  const exs = await db()
    .select()
    .from(exercises)
    .where(and(inArray(exercises.workoutId, ws.map((w) => w.id)), eq(exercises.archived, false)))
    .orderBy(asc(exercises.position));
  return ws.map((w) => ({
    id: w.id,
    name: w.name,
    day_of_week: w.dayOfWeek,
    day: dayLabel(w.dayOfWeek),
    note: w.note,
    exercises: exs
      .filter((e) => e.workoutId === w.id)
      .map((e) => ({
        id: e.id,
        section: e.section,
        name: e.name,
        kind: e.kind,
        sets: e.sets,
        reps: e.reps,
        pair: e.pair,
        tip: e.tip,
        default_weight: e.defaultWeight == null ? null : Number(e.defaultWeight),
        media_id: e.mediaId,
      })),
  }));
}

export function buildMcpServer() {
  const server = new McpServer({ name: "workout-tracker", version: "1.0.0" });

  server.registerTool(
    "list_workouts",
    {
      title: "List workouts",
      description:
        "List Liran's workout plans (the weekly schedule): each workout's id, name, weekday (0=Sunday … 6=Saturday, null = no fixed day), note and full exercise list. Call this before editing a workout.",
      inputSchema: {},
      annotations: { readOnlyHint: true },
    },
    async () => json(await loadWorkouts()),
  );

  server.registerTool(
    "save_workout",
    {
      title: "Create or update a workout",
      description:
        "Create a new workout (omit id) or replace an existing one (pass id). The exercises list is the complete, ordered list: exercises left out are removed from the plan (their history is kept). When editing, start from list_workouts and keep exercise ids. Weekday: 0=Sunday … 6=Saturday.",
      inputSchema: {
        id: z.number().int().optional().describe("Workout id to update; omit to create"),
        name: z.string().min(1),
        day_of_week: z.number().int().min(0).max(6).nullable().optional(),
        note: z.string().optional(),
        exercises: z.array(exerciseSchema).min(1),
      },
    },
    async (a) => {
      const res = await upsertWorkout({
        id: a.id,
        name: a.name,
        dayOfWeek: a.day_of_week ?? null,
        note: a.note ?? "",
        exercises: a.exercises.map((e) => ({
          id: e.id,
          name: e.name,
          section: e.section ?? "חלק עיקרי",
          kind: e.kind ?? "sets",
          sets: e.sets ?? 3,
          reps: e.reps ?? "",
          pair: e.pair ?? "",
          tip: e.tip ?? "",
          defaultWeight: e.default_weight == null ? "" : String(e.default_weight),
          mediaId: e.media_id ?? "",
        })),
      });
      if ("error" in res) return fail(res.error);
      return json({ saved: true, workout: (await loadWorkouts([res.id]))[0] });
    },
  );

  server.registerTool(
    "set_workout_day",
    {
      title: "Schedule a workout on a weekday",
      description: "Move a workout to a weekday (0=Sunday … 6=Saturday) or pass null to unschedule it. Does not change its exercises.",
      inputSchema: {
        workout_id: z.number().int(),
        day_of_week: z.number().int().min(0).max(6).nullable(),
      },
      annotations: { idempotentHint: true },
    },
    async ({ workout_id, day_of_week }) => {
      const r = await db().update(workouts).set({ dayOfWeek: day_of_week }).where(eq(workouts.id, workout_id)).returning({ id: workouts.id });
      if (!r.length) return fail(`workout ${workout_id} not found`);
      return json({ workout_id, day_of_week, day: dayLabel(day_of_week) });
    },
  );

  server.registerTool(
    "delete_workout",
    {
      title: "Delete a workout",
      description: "Remove a workout from the plan. Its past sessions stay in the history.",
      inputSchema: { workout_id: z.number().int() },
      annotations: { destructiveHint: true },
    },
    async ({ workout_id }) => {
      const r = await db().update(workouts).set({ archived: true }).where(eq(workouts.id, workout_id)).returning({ name: workouts.name });
      if (!r.length) return fail(`workout ${workout_id} not found`);
      return json({ deleted: r[0].name });
    },
  );

  server.registerTool(
    "get_history",
    {
      title: "Workout history",
      description:
        "Sessions Liran actually did, newest first: date (Israel time), duration, completion, and per exercise the sets done and the weight used.",
      inputSchema: {
        days: z.number().int().min(1).max(730).optional().describe("Look-back window in days (default 30)"),
        workout_id: z.number().int().optional(),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ days = 30, workout_id }) => {
      const since = new Date(Date.now() - days * 86400_000);
      const ss = await db()
        .select({ id: sessions.id, workoutId: sessions.workoutId, startedAt: sessions.startedAt, finishedAt: sessions.finishedAt, name: workouts.name })
        .from(sessions)
        .innerJoin(workouts, eq(workouts.id, sessions.workoutId))
        .where(and(gte(sessions.startedAt, since), workout_id ? eq(sessions.workoutId, workout_id) : undefined))
        .orderBy(desc(sessions.startedAt));
      if (!ss.length) return json({ days, sessions: [] });

      const ids = ss.map((s) => s.id);
      const [logs, weights, exs] = await Promise.all([
        db().select().from(setLogs).where(inArray(setLogs.sessionId, ids)),
        db().select().from(weightLogs).where(inArray(weightLogs.sessionId, ids)),
        db().select().from(exercises).where(inArray(exercises.workoutId, [...new Set(ss.map((s) => s.workoutId))])).orderBy(asc(exercises.position)),
      ]);

      return json({
        days,
        sessions: ss.map((s) => {
          const list = exs.filter((e) => e.workoutId === s.workoutId);
          const rows = list
            .map((e) => {
              const done = logs.filter((l) => l.sessionId === s.id && l.exerciseId === e.id).length;
              const w = weights.find((x) => x.sessionId === s.id && x.exerciseId === e.id);
              return { name: e.name, kind: e.kind, sets_done: done, sets_planned: e.kind === "check" ? 1 : e.sets, weight_kg: w ? Number(w.weight) : null, archived: e.archived };
            })
            .filter((r) => !r.archived || r.sets_done > 0)
            .map(({ archived, ...r }) => r);
          const done = rows.reduce((n, r) => n + r.sets_done, 0);
          const planned = rows.reduce((n, r) => n + r.sets_planned, 0);
          return {
            session_id: s.id,
            workout: s.name,
            date: fmtDate(s.startedAt),
            finished: !!s.finishedAt,
            duration_min: s.finishedAt ? Math.round((s.finishedAt.getTime() - s.startedAt.getTime()) / 60000) : null,
            completion: `${done}/${planned}`,
            exercises: rows,
          };
        }),
      });
    },
  );

  server.registerTool(
    "get_progress",
    {
      title: "Weight progress",
      description: "Weight used per exercise over time (oldest first). Optionally filter by part of an exercise name.",
      inputSchema: { exercise: z.string().optional().describe("Part of the exercise name, e.g. 'סקוואט'") },
      annotations: { readOnlyHint: true },
    },
    async ({ exercise }) => {
      const rows = await db()
        .select({ name: exercises.name, weight: weightLogs.weight, at: sessions.startedAt })
        .from(weightLogs)
        .innerJoin(exercises, eq(exercises.id, weightLogs.exerciseId))
        .innerJoin(sessions, eq(sessions.id, weightLogs.sessionId))
        .where(exercise ? sql`${exercises.name} ilike ${"%" + exercise + "%"}` : undefined)
        .orderBy(asc(sessions.startedAt));
      const by = new Map<string, { date: string; weight_kg: number }[]>();
      for (const r of rows) by.set(r.name, [...(by.get(r.name) ?? []), { date: fmtDate(r.at).slice(0, 10), weight_kg: Number(r.weight) }]);
      return json([...by.entries()].map(([name, points]) => ({ exercise: name, first: points[0].weight_kg, latest: points.at(-1)!.weight_kg, points })));
    },
  );

  server.registerTool(
    "log_workout",
    {
      title: "Log a completed workout",
      description:
        "Record a workout that was done outside the app (e.g. 'I did Tuesday's workout yesterday'). Pass the exercises done with sets and weight; exercise ids come from list_workouts. If all_done is true every exercise is marked fully done.",
      inputSchema: {
        workout_id: z.number().int(),
        date: z.string().optional().describe("ISO date/time when it started; default now"),
        duration_minutes: z.number().int().min(1).max(300).optional(),
        all_done: z.boolean().optional(),
        exercises: z
          .array(z.object({ exercise_id: z.number().int(), sets_done: z.number().int().min(0).max(12).optional(), weight_kg: z.number().min(0).optional() }))
          .optional(),
      },
    },
    async (a) => {
      const [plan] = await loadWorkouts([a.workout_id]);
      if (!plan) return fail(`workout ${a.workout_id} not found`);
      const start = a.date ? new Date(a.date) : new Date();
      if (Number.isNaN(start.getTime())) return fail("invalid date");
      const end = new Date(start.getTime() + (a.duration_minutes ?? 60) * 60000);
      const [s] = await db().insert(sessions).values({ workoutId: a.workout_id, startedAt: start, finishedAt: end }).returning({ id: sessions.id });

      const given = new Map((a.exercises ?? []).map((e) => [e.exercise_id, e]));
      const sets: { sessionId: number; exerciseId: number; setIndex: number; doneAt: Date }[] = [];
      const ws: { sessionId: number; exerciseId: number; weight: string }[] = [];
      for (const e of plan.exercises) {
        const g = given.get(e.id);
        const n = g?.sets_done ?? (a.all_done || (g && g.sets_done == null) ? e.sets : 0);
        for (let i = 0; i < Math.min(n, e.sets); i++) sets.push({ sessionId: s.id, exerciseId: e.id, setIndex: i, doneAt: end });
        if (g?.weight_kg != null) ws.push({ sessionId: s.id, exerciseId: e.id, weight: String(g.weight_kg) });
      }
      const unknown = [...given.keys()].filter((id) => !plan.exercises.some((e) => e.id === id));
      if (sets.length) await db().insert(setLogs).values(sets);
      if (ws.length) await db().insert(weightLogs).values(ws);
      return json({ logged: true, session_id: s.id, workout: plan.name, date: fmtDate(start), sets_logged: sets.length, weights_logged: ws.length, unknown_exercise_ids: unknown });
    },
  );

  server.registerTool(
    "search_exercise_demos",
    {
      title: "Search exercise demos",
      description: "Search the demo catalog (English names, ~870 exercises) to get a media_id for save_workout.",
      inputSchema: { query: z.string().min(2).describe("English words, e.g. 'dumbbell row'") },
      annotations: { readOnlyHint: true },
    },
    async ({ query }) => {
      const words = query.toLowerCase().split(/\s+/).filter(Boolean);
      const hits = (catalog as { id: string; n: string; m: string; q: string }[])
        .filter((it) => words.every((w) => `${it.n} ${it.m} ${it.q}`.toLowerCase().includes(w)))
        .slice(0, 15)
        .map((it) => ({ media_id: it.id, name: it.n, equipment: it.q, muscle: it.m }));
      return json(hits);
    },
  );

  return server;
}
