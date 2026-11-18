"use client";

import { useEffect, useMemo, useState } from "react";
import ExerciseDemo from "./ExerciseDemo";
import { mediaFrames } from "@/lib/media";

type Item = { id: string; n: string; m: string; q: string };
let cache: Item[] | null = null;

// Search the public-domain exercise catalog (English names) and pick a demo.
export default function MediaPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Item[] | null>(cache);

  useEffect(() => {
    if (!open || items) return;
    import("@/lib/exercise-catalog.json").then((m) => {
      cache = m.default as Item[];
      setItems(cache);
    });
  }, [open, items]);

  const results = useMemo(() => {
    if (!items) return [];
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    return items
      .filter((it) => {
        const hay = `${it.n} ${it.m} ${it.q}`.toLowerCase();
        return words.every((w) => hay.includes(w));
      })
      .slice(0, 30);
  }, [items, q]);

  return (
    <div className="stack" style={{ gap: 6 }}>
      <span className="meta">הדגמה</span>
      <div className="media-row">
        {value ? <ExerciseDemo mediaId={value} name={value.replaceAll("_", " ")} /> : <span className="meta">אין הדגמה</span>}
        <button type="button" className="btn small" onClick={() => setOpen((o) => !o)}>
          {open ? "סגור חיפוש" : value ? "החלף" : "בחר הדגמה"}
        </button>
        {value && (
          <button type="button" className="btn small danger" onClick={() => onChange("")}>הסר</button>
        )}
      </div>
      {open && (
        <div className="picker">
          <label className="f">
            חיפוש באנגלית (למשל: dumbbell row, squat, plank)
            <input value={q} onChange={(e) => setQ(e.target.value)} autoFocus inputMode="search" />
          </label>
          {!items && <span className="meta">טוען…</span>}
          {items && q && results.length === 0 && <span className="meta">לא נמצא. נסה מילה אחרת.</span>}
          <div className="picker-list">
            {results.map((it) => (
              <button
                key={it.id}
                type="button"
                className="picker-item"
                onClick={() => {
                  onChange(it.id);
                  setOpen(false);
                  setQ("");
                }}
              >
                <span className="demo demo-sm" aria-hidden="true">
                  <img src={mediaFrames(it.id)[0]} alt="" loading="lazy" />
                </span>
                <span>
                  {it.n}
                  <span className="meta"> · {it.q}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
