"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { finishSession, reopenSession, restartTimer, saveWeight, toggleSet } from "@/lib/actions";
import { fmtWeight } from "@/lib/days";
import { fmtClock as fmt, progress } from "@/lib/tracker";
import ExerciseDemo from "./ExerciseDemo";

export type TrackerExercise = {
  id: number;
  section: string;
  name: string;
  kind: "sets" | "check";
  sets: number;
  reps: string;
  pair: string | null;
  tip: string | null;
  mediaId: string | null;
  lastWeight: string | null;
  suggested: string | null;
};

type Props = {
  sessionId: number;
  title: string;
  note: string | null;
  startedAt: string;
  finished: boolean;
  exercises: TrackerExercise[];
  initialDone: string[];
  initialWeights: Record<string, string>;
};

export default function Tracker(p: Props) {
  const [done, setDone] = useState(() => new Set(p.initialDone));
  const [weights, setWeights] = useState<Record<string, string>>(() =>
    Object.fromEntries(Object.entries(p.initialWeights).map(([k, v]) => [k, fmtWeight(v) ?? ""])),
  );
  const [, startTransition] = useTransition();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // group by section, keeping order of first appearance
  const sections = useMemo(() => {
    const m = new Map<string, TrackerExercise[]>();
    for (const e of p.exercises) m.set(e.section, [...(m.get(e.section) ?? []), e]);
    return [...m.entries()];
  }, [p.exercises]);

  const keys = useMemo(
    () => p.exercises.flatMap((e) => Array.from({ length: e.kind === "check" ? 1 : e.sets }, (_, i) => `${e.id}-${i}`)),
    [p.exercises],
  );
  const { count: doneCount, pct } = progress(keys, done);

  // The sticky bar sits right under the (also sticky) top nav.
  useEffect(() => {
    const nav = document.querySelector<HTMLElement>(".nav");
    if (!nav) return;
    const set = () => document.documentElement.style.setProperty("--nav-h", `${nav.offsetHeight}px`);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(nav);
    return () => ro.disconnect();
  }, []);

  /* elapsed */
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const [startedAt, setStartedAt] = useState(p.startedAt);
  useEffect(() => setStartedAt(p.startedAt), [p.startedAt]);
  const elapsed = Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000));
  const [resetArmed, setResetArmed] = useState(false);
  const resetClock = () => {
    if (!resetArmed) {
      setResetArmed(true);
      setTimeout(() => setResetArmed(false), 3000);
      return;
    }
    setResetArmed(false);
    setStartedAt(new Date().toISOString());
    run(() => restartTimer(p.sessionId));
  };

  /* rest timer */
  const [restEnd, setRestEnd] = useState(0);
  const [toast, setToast] = useState(false);
  const lastRest = useRef(90);
  const audio = useRef<AudioContext | null>(null);
  const unlock = () => {
    try {
      audio.current ??= new AudioContext();
      if (audio.current.state === "suspended") void audio.current.resume();
    } catch {}
  };
  const beep = () => {
    const ac = audio.current;
    if (!ac) return;
    try {
      [0, 0.25, 0.5].forEach((t) => {
        const o = ac.createOscillator(), g = ac.createGain();
        o.frequency.value = 880;
        o.connect(g); g.connect(ac.destination);
        g.gain.setValueAtTime(0.25, ac.currentTime + t);
        g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + t + 0.2);
        o.start(ac.currentTime + t); o.stop(ac.currentTime + t + 0.22);
      });
      navigator.vibrate?.([200, 100, 200]);
    } catch {}
  };
  const restLeft = restEnd ? Math.max(0, Math.ceil((restEnd - now) / 1000)) : 0;
  useEffect(() => {
    if (restEnd && restLeft === 0) {
      setRestEnd(0);
      beep();
      setToast(true);
      const t = setTimeout(() => setToast(false), 3500);
      return () => clearTimeout(t);
    }
  }, [restEnd, restLeft]);
  const startRest = (sec: number) => {
    unlock();
    setToast(false);
    if (!sec) return setRestEnd(0);
    lastRest.current = sec;
    setRestEnd(Date.now() + sec * 1000);
  };

  /* actions */
  const run = (fn: () => Promise<unknown>) =>
    startTransition(async () => {
      try {
        await fn();
        setError(null);
      } catch {
        setError("השמירה נכשלה – בדוק חיבור לאינטרנט");
      }
    });

  const toggle = (e: TrackerExercise, i: number) => {
    unlock();
    const k = `${e.id}-${i}`;
    const on = !done.has(k);
    setDone((d) => {
      const n = new Set(d);
      if (on) n.add(k); else n.delete(k);
      return n;
    });
    run(() => toggleSet(p.sessionId, e.id, i, on));
    if (on && e.kind === "sets") {
      // In a superset, rest only after the second exercise of the pair.
      const idx = p.exercises.findIndex((x) => x.id === e.id);
      const next = p.exercises[idx + 1];
      const firstOfPair = !!e.pair && next?.pair === e.pair;
      if (!firstOfPair) startRest(lastRest.current);
    }
    // Pre-fill weight on first set if empty.
    if (on && e.kind === "sets" && !weights[e.id] && e.suggested) {
      const w = fmtWeight(e.suggested) ?? "";
      setWeights((ws) => ({ ...ws, [e.id]: w }));
      run(() => saveWeight(p.sessionId, e.id, w));
    }
  };

  const timers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const changeWeight = (id: number, v: string) => {
    setWeights((ws) => ({ ...ws, [id]: v }));
    clearTimeout(timers.current[id]);
    timers.current[id] = setTimeout(() => run(() => saveWeight(p.sessionId, id, v)), 600);
  };

  const pairNote = p.exercises.some((e) => e.pair);

  return (
    <>
      <header className="hero">
        <div className="hero-in">
          <h1>{p.title}</h1>
          {p.note && <p>{p.note}</p>}
          <div className="plates" aria-hidden="true">
            {keys.map((k, i) => <i key={k} className={`plate${i < doneCount ? " on" : ""}`} />)}
          </div>
        </div>
      </header>

      <div className="timer" role="region" aria-label="התקדמות וטיימר מנוחה">
        <div className="timer-in">
          <div className="stats">
            <span><b>{pct}%</b>הושלם</span>
            <span><b>{doneCount}/{keys.length}</b>סטים</span>
            <span>
              <b>{fmt(elapsed)}</b>זמן אימון
              {!p.finished && (
                <button className={`reset${resetArmed ? " armed" : ""}`} onClick={resetClock} aria-label="אפס את זמן האימון">
                  {resetArmed ? "לאפס?" : "↺ אפס"}
                </button>
              )}
            </span>
          </div>
          <div className="bar" aria-hidden="true"><i style={{ width: `${pct}%` }} /></div>
          <div className="rest">
            <span className="lbl">מנוחה</span>
            {[60, 90, 120].map((s) => (
              <button key={s} className="tbtn" onClick={() => startRest(s)}>{s}</button>
            ))}
            <button className="tbtn" onClick={() => startRest(0)} aria-label="עצור טיימר">✕</button>
            <span className={`clock${restLeft ? " run" : ""}`} aria-live="polite">{fmt(restLeft)}</span>
          </div>
        </div>
      </div>

      <main className="page">
        {error && <p className="error">{error}</p>}
        {p.finished && (
          <div className="note row">
            <span>האימון הזה כבר הסתיים.</span>
            <button className="btn small" onClick={() => run(() => reopenSession(p.sessionId))}>פתח מחדש</button>
          </div>
        )}

        {sections.map(([title, list]) => (
          <section key={title}>
            <h2 className="sec-h">{title}</h2>
            {list.every((e) => e.kind === "check") ? (
              <div className="card">
                {list.map((e) => {
                  const on = done.has(`${e.id}-0`);
                  return (
                    <div key={e.id} className="check">
                      <button className={`chk${on ? " on" : ""}`} aria-pressed={on} aria-label={e.name} onClick={() => toggle(e, 0)}>✓</button>
                      <span>{e.name}{e.reps && <span className="meta"> · {e.reps}</span>}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              list.map((e) => {
                const full = Array.from({ length: e.sets }, (_, i) => done.has(`${e.id}-${i}`)).every(Boolean);
                if (e.kind === "check") {
                  const on = done.has(`${e.id}-0`);
                  return (
                    <div key={e.id} className="card check">
                      <button className={`chk${on ? " on" : ""}`} aria-pressed={on} aria-label={e.name} onClick={() => toggle(e, 0)}>✓</button>
                      <span>{e.name}</span>
                    </div>
                  );
                }
                return (
                  <div key={e.id} className={`card ex${full ? " full" : ""}`}>
                    <div className="ex-top">
                      {e.mediaId && <ExerciseDemo mediaId={e.mediaId} name={e.name} />}
                      <div className="grow">
                        <div className="ex-name">
                          {e.name}
                          {e.pair && <span className="chip">זוג {e.pair}</span>}
                        </div>
                        <div className="meta">{e.sets} סטים × {e.reps}</div>
                      </div>
                      <div>
                        <label className="weight">
                          ק״ג
                          <input
                            inputMode="decimal"
                            value={weights[e.id] ?? ""}
                            placeholder={fmtWeight(e.suggested) ?? "–"}
                            onChange={(ev) => changeWeight(e.id, ev.target.value)}
                            aria-label={`משקל ${e.name}`}
                          />
                        </label>
                        {e.lastWeight && <div className="prev">פעם קודמת: {fmtWeight(e.lastWeight)}</div>}
                      </div>
                    </div>
                    {e.tip && <div className="tip">{e.tip}</div>}
                    <div className="sets">
                      {Array.from({ length: e.sets }, (_, i) => {
                        const on = done.has(`${e.id}-${i}`);
                        return (
                          <button key={i} className={`set${on ? " on" : ""}`} aria-pressed={on} onClick={() => toggle(e, i)}>
                            סט {i + 1}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
            {pairNote && list.some((e) => e.pair) && (
              <div className="note">עבודה בזוגות: סט מתרגיל אחד, סט מהשני, ואז מנוחה. הטיימר מתחיל לבד אחרי התרגיל השני בזוג.</div>
            )}
          </section>
        ))}

        {!p.finished && (
          <div className="finish-bar">
            <span className="meta">{doneCount === keys.length ? "כל הכבוד – הכל סומן!" : `נשארו ${keys.length - doneCount} סטים`}</span>
            <button
              className="btn primary"
              disabled={saving}
              onClick={() => {
                setSaving(true);
                startTransition(() => finishSession(p.sessionId));
              }}
            >
              {saving ? "שומר…" : "סיום אימון"}
            </button>
          </div>
        )}
      </main>
      <div className={`toast${toast ? " show" : ""}`}>המנוחה נגמרה – לסט הבא</div>
    </>
  );
}
