"use client";

import { useState, useTransition } from "react";
import { archiveWorkout, saveWorkout, type ExerciseInput, type WorkoutInput } from "@/lib/actions";
import { DAYS, SECTIONS } from "@/lib/days";

const blank = (section = "חלק עיקרי"): ExerciseInput => ({
  section, name: "", kind: "sets", sets: 3, reps: "10", pair: "", tip: "", defaultWeight: "",
});

export default function WorkoutEditor({ initial }: { initial?: WorkoutInput }) {
  const [w, setW] = useState<WorkoutInput>(
    initial ?? { name: "", dayOfWeek: null, note: "", exercises: [blank("חימום"), blank()] },
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [confirmDel, setConfirmDel] = useState(false);

  const setEx = (i: number, patch: Partial<ExerciseInput>) =>
    setW((cur) => ({ ...cur, exercises: cur.exercises.map((e, j) => (j === i ? { ...e, ...patch } : e)) }));
  const move = (i: number, d: -1 | 1) =>
    setW((cur) => {
      const ex = [...cur.exercises];
      const j = i + d;
      if (j < 0 || j >= ex.length) return cur;
      [ex[i], ex[j]] = [ex[j], ex[i]];
      return { ...cur, exercises: ex };
    });
  const remove = (i: number) => setW((cur) => ({ ...cur, exercises: cur.exercises.filter((_, j) => j !== i) }));
  const add = () =>
    setW((cur) => ({ ...cur, exercises: [...cur.exercises, blank(cur.exercises.at(-1)?.section ?? "חלק עיקרי")] }));

  const save = () =>
    start(async () => {
      const res = await saveWorkout(w);
      if (res?.error) setError(res.error);
    });

  return (
    <main className="page">
      <h1 className="page-title">{initial?.id ? "עריכת אימון" : "אימון חדש"}</h1>
      <div className="card stack">
        <div className="grid2">
          <label className="f">
            שם האימון
            <input value={w.name} onChange={(e) => setW({ ...w, name: e.target.value })} placeholder="כוח – ראשון" />
          </label>
          <label className="f">
            יום
            <select
              value={w.dayOfWeek ?? ""}
              onChange={(e) => setW({ ...w, dayOfWeek: e.target.value === "" ? null : Number(e.target.value) })}
            >
              <option value="">ללא יום קבוע</option>
              {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
            </select>
          </label>
        </div>
        <label className="f">
          הערה (אופציונלי)
          <input value={w.note} onChange={(e) => setW({ ...w, note: e.target.value })} placeholder="שעה בקאנטרי · גוף עליון וליבה" />
        </label>
      </div>

      <datalist id="sections">{SECTIONS.map((s) => <option key={s} value={s} />)}</datalist>

      <h2 className="sec-h">תרגילים</h2>
      {w.exercises.map((e, i) => (
        <div key={e.id ?? `n${i}`} className="card stack">
          <div className="ed-head">
            <span className="num">{i + 1}</span>
            <div className="row" style={{ gap: 6 }}>
              <button type="button" className="btn small" onClick={() => move(i, -1)} disabled={i === 0} aria-label="הזז למעלה">↑</button>
              <button type="button" className="btn small" onClick={() => move(i, 1)} disabled={i === w.exercises.length - 1} aria-label="הזז למטה">↓</button>
              <button type="button" className="btn small danger" onClick={() => remove(i)}>הסר</button>
            </div>
          </div>
          <div className="grid2">
            <label className="f">
              שם התרגיל
              <input value={e.name} onChange={(ev) => setEx(i, { name: ev.target.value })} />
            </label>
            <label className="f">
              חלק
              <input list="sections" value={e.section} onChange={(ev) => setEx(i, { section: ev.target.value })} />
            </label>
          </div>
          <div className="grid4">
            <label className="f">
              סוג
              <select value={e.kind} onChange={(ev) => setEx(i, { kind: ev.target.value as "sets" | "check" })}>
                <option value="sets">סטים</option>
                <option value="check">סימון</option>
              </select>
            </label>
            {e.kind === "sets" && (
              <label className="f">
                סטים
                <input inputMode="numeric" value={e.sets} onChange={(ev) => setEx(i, { sets: Number(ev.target.value) || 0 })} />
              </label>
            )}
            <label className="f">
              חזרות / זמן
              <input value={e.reps} onChange={(ev) => setEx(i, { reps: ev.target.value })} />
            </label>
            {e.kind === "sets" && (
              <>
                <label className="f">
                  ק״ג התחלתי
                  <input inputMode="decimal" value={e.defaultWeight} onChange={(ev) => setEx(i, { defaultWeight: ev.target.value })} />
                </label>
                <label className="f">
                  זוג (A/B/C)
                  <input value={e.pair} onChange={(ev) => setEx(i, { pair: ev.target.value.toUpperCase() })} maxLength={3} />
                </label>
              </>
            )}
          </div>
          <label className="f">
            טיפ
            <input value={e.tip} onChange={(ev) => setEx(i, { tip: ev.target.value })} />
          </label>
        </div>
      ))}
      <button type="button" className="btn" onClick={add}>+ הוסף תרגיל</button>

      <div className="sticky-save">
        <button className="btn primary" onClick={save} disabled={pending}>{pending ? "שומר…" : "שמירה"}</button>
        {initial?.id && (
          <button
            className={`btn ${confirmDel ? "danger" : ""}`}
            onClick={() => (confirmDel ? start(() => archiveWorkout(initial.id!)) : setConfirmDel(true))}
          >
            {confirmDel ? "בטוח? לחץ שוב" : "מחיקת אימון"}
          </button>
        )}
        {error && <span className="error">{error}</span>}
      </div>
    </main>
  );
}
