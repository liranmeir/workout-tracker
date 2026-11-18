import Link from "next/link";
import { asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { exercises, sessions, setLogs, weightLogs, workouts } from "@/lib/schema";
import { requireAuth } from "@/lib/auth";
import { deleteSession } from "@/lib/actions";
import { duration, fmtWeight, shortDate } from "@/lib/days";
import ConfirmButton from "@/components/ConfirmButton";

export const dynamic = "force-dynamic";

export default async function History() {
  await requireAuth();
  const list = await db()
    .select({
      id: sessions.id,
      startedAt: sessions.startedAt,
      finishedAt: sessions.finishedAt,
      name: workouts.name,
      done: sql<number>`(select count(*)::int from ${setLogs} l where l.session_id = "sessions"."id")`,
      total: sql<number>`(select coalesce(sum(case when e.kind = 'check' then 1 else e.sets end), 0)::int from ${exercises} e where e.workout_id = "sessions"."workout_id" and not e.archived)`,
    })
    .from(sessions)
    .innerJoin(workouts, eq(workouts.id, sessions.workoutId))
    .orderBy(desc(sessions.startedAt))
    .limit(60);

  // Weight progression per exercise (oldest → newest).
  const prog = await db()
    .select({ exerciseId: weightLogs.exerciseId, name: exercises.name, weight: weightLogs.weight, at: sessions.startedAt })
    .from(weightLogs)
    .innerJoin(exercises, eq(exercises.id, weightLogs.exerciseId))
    .innerJoin(sessions, eq(sessions.id, weightLogs.sessionId))
    .orderBy(asc(sessions.startedAt));
  const byEx = new Map<number, { name: string; vals: number[] }>();
  for (const r of prog) {
    const cur = byEx.get(r.exerciseId) ?? { name: r.name, vals: [] };
    cur.vals.push(Number(r.weight));
    byEx.set(r.exerciseId, cur);
  }

  return (
    <main className="page">
      <h1 className="page-title">היסטוריה</h1>
      <p className="sub">אימונים שבוצעו והתקדמות במשקלים.</p>

      {byEx.size > 0 && (
        <div className="card">
          <h2 className="sec-h" style={{ marginTop: 0 }}>התקדמות במשקלים</h2>
          <table className="prog">
            <thead>
              <tr><th>תרגיל</th><th className="n">התחלה</th><th className="n">אחרון</th><th className="n">שינוי</th></tr>
            </thead>
            <tbody>
              {[...byEx.values()].map((x) => {
                const first = x.vals[0], last = x.vals.at(-1)!, diff = last - first;
                return (
                  <tr key={x.name}>
                    <td>{x.name}</td>
                    <td className="n">{fmtWeight(first)}</td>
                    <td className="n">{fmtWeight(last)}</td>
                    <td className={`n${diff > 0 ? " up" : ""}`}>{diff > 0 ? `+${fmtWeight(diff)}` : diff === 0 ? "–" : fmtWeight(diff)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {list.length === 0 && <div className="card empty">עוד לא בוצעו אימונים.</div>}
      {list.map((s) => {
        const pct = s.total ? Math.min(100, Math.round((s.done / s.total) * 100)) : 0;
        return (
          <div key={s.id} className="card">
            <div className="hist-row">
              <Link href={`/sessions/${s.id}`} style={{ textDecoration: "none" }}>
                <strong>{s.name}</strong>
                <div className="meta">
                  {shortDate(s.startedAt)}
                  {s.finishedAt ? ` · ${duration(s.startedAt, s.finishedAt)}` : " · לא הסתיים"}
                  {` · ${s.done}/${s.total} סטים`}
                </div>
              </Link>
              <form action={deleteSession.bind(null, s.id)}>
                <ConfirmButton label="מחק" />
              </form>
            </div>
            <div className="bar-track"><div className="bar-fill" style={{ width: `${pct}%` }} /></div>
          </div>
        );
      })}
    </main>
  );
}
