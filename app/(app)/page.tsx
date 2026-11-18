import Link from "next/link";
import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { exercises, sessions, workouts } from "@/lib/schema";
import { requireAuth } from "@/lib/auth";
import { startSession } from "@/lib/actions";
import { dayName, shortDate, todayIndex } from "@/lib/days";

export const dynamic = "force-dynamic";

export default async function Home() {
  await requireAuth();
  const list = await db()
    .select({
      id: workouts.id,
      name: workouts.name,
      dayOfWeek: workouts.dayOfWeek,
      note: workouts.note,
      count: sql<number>`(select count(*)::int from ${exercises} e where e.workout_id = ${workouts.id} and not e.archived)`,
      last: sql<string | null>`(select max(s.started_at) from ${sessions} s where s.workout_id = ${workouts.id} and s.finished_at is not null)`,
      openId: sql<number | null>`(select s.id from ${sessions} s where s.workout_id = ${workouts.id} and s.finished_at is null and s.started_at > now() - interval '12 hours' order by s.started_at desc limit 1)`,
    })
    .from(workouts)
    .where(eq(workouts.archived, false))
    .orderBy(sql`${workouts.dayOfWeek} is null`, asc(workouts.dayOfWeek), asc(workouts.id));

  const today = todayIndex();

  return (
    <main className="page">
      <div className="row">
        <h1 className="page-title">האימונים שלי</h1>
        <Link href="/workouts/new" className="btn dark">+ אימון חדש</Link>
      </div>
      <p className="sub">בחר אימון כדי להתחיל. סימון סטים ומשקלים נשמרים מיד.</p>

      {list.length === 0 && (
        <div className="card empty">
          אין עדיין אימונים. <Link href="/workouts/new">צור את הראשון</Link>
        </div>
      )}

      {list.map((w) => (
        <div key={w.id} className="card">
          <div className="row">
            <h2 className="w-name">
              {w.name}
              {w.dayOfWeek === today && <span className="chip">היום</span>}
            </h2>
            <span className="meta">{dayName(w.dayOfWeek)}</span>
          </div>
          <div className="meta">
            {w.count} תרגילים
            {w.last ? ` · אחרון: ${shortDate(new Date(w.last))}` : " · עוד לא בוצע"}
          </div>
          {w.note && <div className="tip">{w.note}</div>}
          <div className="w-actions">
            <form action={startSession.bind(null, w.id)}>
              <button className="btn primary">{w.openId ? "המשך אימון" : "התחל אימון"}</button>
            </form>
            <Link href={`/workouts/${w.id}/edit`} className="btn">עריכה</Link>
          </div>
        </div>
      ))}
    </main>
  );
}
