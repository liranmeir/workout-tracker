"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { archiveWorkout, saveWorkout, type ExerciseInput, type WorkoutInput } from "@/lib/actions";
import { DAYS, SECTIONS } from "@/lib/days";
import { clampSets, exerciseSummary, sectionStarts, workoutTotals } from "@/lib/editor";
import MediaPicker from "./MediaPicker";

const blank = (section = "חלק עיקרי"): ExerciseInput => ({
  section, name: "", kind: "sets", sets: 3, reps: "10", pair: "", tip: "", defaultWeight: "", mediaId: "",
});

type Row = { key: number; ex: ExerciseInput };

export default function WorkoutEditor({ initial }: { initial?: WorkoutInput }) {
  const nextKey = useRef(0);
  const mk = (ex: ExerciseInput): Row => ({ key: nextKey.current++, ex });

  const [head, setHead] = useState({
    name: initial?.name ?? "",
    dayOfWeek: initial?.dayOfWeek ?? (null as number | null),
    note: initial?.note ?? "",
  });
  const [rows, setRows] = useState<Row[]>(() =>
    (initial?.exercises ?? [blank("חימום"), blank()]).map(mk),
  );
  // Existing workouts open collapsed so 17 exercises don't mean 17 screens of fields.
  const [open, setOpen] = useState<Set<number>>(() => new Set(initial?.id ? [] : [0, 1]));
  const [justAdded, setJustAdded] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [confirmDel, setConfirmDel] = useState(false);

  useEffect(() => {
    if (justAdded == null) return;
    document.getElementById(`ex-${justAdded}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [justAdded]);

  const toggle = (key: number) => {
    setJustAdded(null);
    setOpen((cur) => {
      const n = new Set(cur);
      if (n.has(key)) n.delete(key);
      else n.add(key);
      return n;
    });
  };
  const setEx = (key: number, patch: Partial<ExerciseInput>) =>
    setRows((cur) => cur.map((r) => (r.key === key ? { ...r, ex: { ...r.ex, ...patch } } : r)));
  const move = (i: number, d: -1 | 1) =>
    setRows((cur) => {
      const j = i + d;
      if (j < 0 || j >= cur.length) return cur;
      const next = [...cur];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  const remove = (key: number) => setRows((cur) => cur.filter((r) => r.key !== key));
  const add = () => {
    const row = mk(blank(rows.at(-1)?.ex.section ?? "חלק עיקרי"));
    setRows((cur) => [...cur, row]);
    setOpen((cur) => new Set(cur).add(row.key));
    setJustAdded(row.key);
  };

  const save = () =>
    start(async () => {
      setError(null);
      const res = await saveWorkout({ ...head, id: initial?.id, exercises: rows.map((r) => r.ex) });
      if (res?.error) setError(res.error);
    });

  const totals = workoutTotals(rows.map((r) => r.ex));
  const starts = sectionStarts(rows.map((r) => r.ex));
  const allOpen = rows.length > 0 && rows.every((r) => open.has(r.key));

  return (
    <main className="page editor">
      <Link href="/" className="back">→ חזרה לאימונים</Link>
      <h1 className="page-title">{initial?.id ? "עריכת אימון" : "אימון חדש"}</h1>

      <section className="card stack" aria-label="פרטי האימון">
        <label className="f">
          שם האימון
          <input value={head.name} onChange={(e) => setHead({ ...head, name: e.target.value })} placeholder="כוח – ראשון" />
        </label>
        <div className="f">
          <span id="day-lbl">יום באימון</span>
          <div className="days" role="radiogroup" aria-labelledby="day-lbl">
            {DAYS.map((d, i) => (
              <button
                key={d}
                type="button"
                role="radio"
                aria-checked={head.dayOfWeek === i}
                className={`day${head.dayOfWeek === i ? " on" : ""}`}
                onClick={() => setHead({ ...head, dayOfWeek: head.dayOfWeek === i ? null : i })}
              >
                {d}
              </button>
            ))}
          </div>
          <span className="hint">לחיצה נוספת מבטלת את היום (אימון ללא יום קבוע).</span>
        </div>
        <label className="f">
          הערה (אופציונלי)
          <input value={head.note} onChange={(e) => setHead({ ...head, note: e.target.value })} placeholder="שעה בקאנטרי · גוף עליון וליבה" />
        </label>
      </section>

      <datalist id="sections">{SECTIONS.map((s) => <option key={s} value={s} />)}</datalist>

      <div className="row ex-bar">
        <h2 className="sec-h" style={{ margin: 0 }}>
          תרגילים <span className="count">{totals.exercises} · {totals.sets} סטים</span>
        </h2>
        {rows.length > 1 && (
          <button
            type="button"
            className="btn ghost small"
            onClick={() => setOpen(allOpen ? new Set() : new Set(rows.map((r) => r.key)))}
          >
            {allOpen ? "כווץ הכל" : "הרחב הכל"}
          </button>
        )}
      </div>

      {rows.map((r, i) => {
        const e = r.ex;
        const isOpen = open.has(r.key);
        return (
          <div key={r.key} id={`ex-${r.key}`}>
            {starts[i] && <h3 className="sec-label">{e.section.trim() || "ללא חלק"}</h3>}
            <div className={`ex-row${isOpen ? " open" : ""}`}>
              <div className="ex-line">
                <button
                  type="button"
                  className="ex-toggle"
                  aria-expanded={isOpen}
                  aria-controls={`ex-body-${r.key}`}
                  onClick={() => toggle(r.key)}
                >
                  <span className="ex-n">{i + 1}</span>
                  <span className="ex-main">
                    <span className={`ex-title${e.name.trim() ? "" : " empty"}`}>{e.name.trim() || "תרגיל חדש"}</span>
                    <span className="meta">{exerciseSummary(e)}</span>
                  </span>
                  <span className="chev" aria-hidden>▾</span>
                </button>
                <div className="mv">
                  <button type="button" className="icon-btn" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`הזז את ${e.name || "התרגיל"} למעלה`}>↑</button>
                  <button type="button" className="icon-btn" onClick={() => move(i, 1)} disabled={i === rows.length - 1} aria-label={`הזז את ${e.name || "התרגיל"} למטה`}>↓</button>
                </div>
              </div>

              {isOpen && (
                <div className="ex-body stack" id={`ex-body-${r.key}`}>
                  <label className="f">
                    שם התרגיל
                    <input value={e.name} autoFocus={justAdded === r.key} onChange={(ev) => setEx(r.key, { name: ev.target.value })} />
                  </label>
                  <div className="grid2e">
                    <label className="f">
                      חלק באימון
                      <input list="sections" value={e.section} onChange={(ev) => setEx(r.key, { section: ev.target.value })} />
                    </label>
                    <div className="f">
                      <span>סוג</span>
                      <div className="seg" role="radiogroup" aria-label="סוג תרגיל">
                        {([["sets", "סטים"], ["check", "סימון"]] as const).map(([k, label]) => (
                          <button
                            key={k}
                            type="button"
                            role="radio"
                            aria-checked={e.kind === k}
                            className={e.kind === k ? "on" : ""}
                            onClick={() => setEx(r.key, { kind: k })}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid2e">
                    {e.kind === "sets" && (
                      <div className="f">
                        <span>מספר סטים</span>
                        <div className="stepper">
                          <button type="button" aria-label="פחות סטים" onClick={() => setEx(r.key, { sets: clampSets(e.sets - 1) })} disabled={e.sets <= 1}>−</button>
                          <output aria-live="polite">{e.sets}</output>
                          <button type="button" aria-label="יותר סטים" onClick={() => setEx(r.key, { sets: clampSets(e.sets + 1) })} disabled={e.sets >= 12}>+</button>
                        </div>
                      </div>
                    )}
                    <label className="f">
                      חזרות / זמן
                      <input value={e.reps} placeholder="10 או 30 שנ׳" onChange={(ev) => setEx(r.key, { reps: ev.target.value })} />
                    </label>
                    {e.kind === "sets" && (
                      <>
                        <label className="f">
                          ק״ג התחלתי
                          <input inputMode="decimal" value={e.defaultWeight} placeholder="ללא" onChange={(ev) => setEx(r.key, { defaultWeight: ev.target.value })} />
                        </label>
                        <label className="f">
                          זוג סופרסט (A/B/C)
                          <input value={e.pair} maxLength={3} placeholder="ללא" onChange={(ev) => setEx(r.key, { pair: ev.target.value.toUpperCase() })} />
                        </label>
                      </>
                    )}
                  </div>

                  <label className="f">
                    טיפ (אופציונלי)
                    <input value={e.tip} onChange={(ev) => setEx(r.key, { tip: ev.target.value })} />
                  </label>
                  {e.kind === "sets" && <MediaPicker value={e.mediaId} onChange={(mediaId) => setEx(r.key, { mediaId })} />}

                  <div className="row ex-foot">
                    <button type="button" className="btn small danger" onClick={() => remove(r.key)}>הסר תרגיל</button>
                    <button type="button" className="btn small" onClick={() => toggle(r.key)}>סיום ✓</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}

      <button type="button" className="add-ex" onClick={add}>+ הוסף תרגיל</button>

      {initial?.id && (
        <section className="card danger-zone">
          <div>
            <strong>מחיקת האימון</strong>
            <div className="meta">ההיסטוריה של אימונים שבוצעו נשמרת.</div>
          </div>
          <button
            type="button"
            className="btn danger"
            onClick={() => (confirmDel ? start(() => archiveWorkout(initial.id!)) : setConfirmDel(true))}
            onBlur={() => setConfirmDel(false)}
          >
            {confirmDel ? "בטוח? לחץ שוב" : "מחק אימון"}
          </button>
        </section>
      )}

      <div className="sticky-save">
        {error && <div className="error" role="alert">{error}</div>}
        <div className="save-row">
          <button className="btn primary" onClick={save} disabled={pending}>{pending ? "שומר…" : "שמירה"}</button>
          <Link href="/" className="btn">ביטול</Link>
        </div>
      </div>
    </main>
  );
}
