import {
  pgTable,
  serial,
  integer,
  text,
  numeric,
  boolean,
  timestamp,
  primaryKey,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// Credentials are not stored here: APP_PASSWORD_<USERNAME> / MCP_SECRET_<USERNAME> env vars (see lib/users.ts).
export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    username: text("username").notNull(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("users_username_idx").on(t.username)],
);

export const workouts = pgTable("workouts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  // 0 = Sunday … 6 = Saturday; null = no fixed day
  dayOfWeek: integer("day_of_week"),
  note: text("note"),
  archived: boolean("archived").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("workouts_user_idx").on(t.userId)]);

export const exercises = pgTable(
  "exercises",
  {
    id: serial("id").primaryKey(),
    workoutId: integer("workout_id")
      .notNull()
      .references(() => workouts.id, { onDelete: "cascade" }),
    section: text("section").notNull().default("חלק עיקרי"),
    name: text("name").notNull(),
    // "sets" = numbered sets with weight; "check" = single checklist item
    kind: text("kind").notNull().default("sets"),
    sets: integer("sets").notNull().default(3),
    reps: text("reps").notNull().default(""),
    pair: text("pair"),
    tip: text("tip"),
    defaultWeight: numeric("default_weight"),
    // id in the free-exercise-db catalog, used for the demo animation
    mediaId: text("media_id"),
    position: integer("position").notNull().default(0),
    // soft-delete so history survives edits
    archived: boolean("archived").notNull().default(false),
  },
  (t) => [index("exercises_workout_idx").on(t.workoutId)],
);

export const sessions = pgTable(
  "sessions",
  {
    id: serial("id").primaryKey(),
    workoutId: integer("workout_id")
      .notNull()
      .references(() => workouts.id, { onDelete: "cascade" }),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
  },
  (t) => [index("sessions_workout_idx").on(t.workoutId)],
);

export const setLogs = pgTable(
  "set_logs",
  {
    sessionId: integer("session_id")
      .notNull()
      .references(() => sessions.id, { onDelete: "cascade" }),
    exerciseId: integer("exercise_id")
      .notNull()
      .references(() => exercises.id, { onDelete: "cascade" }),
    setIndex: integer("set_index").notNull(),
    doneAt: timestamp("done_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.sessionId, t.exerciseId, t.setIndex] })],
);

export const weightLogs = pgTable(
  "weight_logs",
  {
    sessionId: integer("session_id")
      .notNull()
      .references(() => sessions.id, { onDelete: "cascade" }),
    exerciseId: integer("exercise_id")
      .notNull()
      .references(() => exercises.id, { onDelete: "cascade" }),
    weight: numeric("weight").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.sessionId, t.exerciseId] })],
);

export type User = typeof users.$inferSelect;
export type Workout = typeof workouts.$inferSelect;
export type Exercise = typeof exercises.$inferSelect;
