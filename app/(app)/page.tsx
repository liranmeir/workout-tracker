import Link from "next/link";
import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { exercises, sessions, workouts } from "@/lib/schema";
import { requireUser } from "@/lib/auth";
import { startSession } from "@/lib/actions";
import { nextTag, startLabel } from "@/lib/labels";
import { dayName, dayWithDate, planUpcoming, shortDate } from "@/lib/days";

export const dynamic = "force-dynamic";

export default async function Home() {
  const userId = await requireUser();
  const list = await db()
    .select({
      id: workouts.id,
      name: workouts.name,
      dayOfWeek: workouts.dayOfWeek,
      note: workouts.note,
      count: sql<number>`(select count(*)::int from ${exercises} e where e.workout_id = "workouts"."id" and not e.archived)`,
      last: sql<string | null>`(select max(s.started_at) from ${sessions} s where s.workout_id = "workouts"."id" and s.finished_at is not null)`,
      openId: sql<number | null>`(select s.id from ${sessions} s where s.workout_id = "workouts"."id" and s.finished_at is null and s.started_at > now() - interval '12 hours' order by s.started_at desc limit 1)`,
    })
    .from(workouts)
    .where(and(eq(workouts.userId, userId), eq(workouts.archived, false)))
    .orderBy(sql`${workouts.dayOfWeek} is null`, asc(workouts.dayOfWeek), asc(workouts.id));

  const now = new Date();
  const { items, nextId } = planUpcoming(list, now);

  return (
    <main className="page">
      <div className="row">
        <h1 className="page-title">האימונים שלי</h1>
        <Link href="/workouts/new" className="btn dark">+ אימון חדש</Link>
      </div>
      <p className="sub">האימון הבא מסומן למעלה. סימון סטים ומשקלים נשמרים מיד.</p>

      {list.length === 0 && (
        <div className="card empty">
          אין עדיין אימונים. <Link href="/workouts/new">צור את הראשון</Link>
        </div>
      )}

      {items.map(({ w, offset }) => {
        const isNext = w.id === nextId;
        return (
          <div key={w.id} className={`card${isNext ? " next" : ""}`}>
            {isNext && <div className="next-tag">{nextTag(!!w.openId)}</div>}
            <div className="row">
              <h2 className="w-name">{w.name}</h2>
              <Link href={`/workouts/${w.id}/edit`} className="btn ghost small" aria-label={`עריכת ${w.name}`}>
                ✎ עריכה
              </Link>
            </div>
            <div className={`when${offset === 0 ? " today" : ""}`}>
              {w.dayOfWeek == null || offset == null ? dayName(null) : dayWithDate(w.dayOfWeek, offset, now)}
            </div>
            <div className="meta">
              {w.count} תרגילים
              {w.last ? ` · אחרון: ${shortDate(new Date(w.last))}` : " · עוד לא בוצע"}
            </div>
            {w.note && <div className="tip">{w.note}</div>}
            <form action={startSession.bind(null, w.id)} className="w-actions">
              <button className={`btn primary start${isNext ? " big" : ""}`}>{startLabel(!!w.openId)}</button>
            </form>
          </div>
        );
      })}
    </main>
  );
}
