"use client";

import { useEffect, useState } from "react";
import { mediaFrames } from "@/lib/media";

// Two-frame looping demo (start / end position), like a small GIF.
// Tap to open it large.
export default function ExerciseDemo({ mediaId, name, size = "sm" }: { mediaId: string; name: string; size?: "xs" | "sm" | "lg" }) {
  const [a, b] = mediaFrames(mediaId);
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (failed) return null;

  const anim = (
    <span className={`demo demo-${size}`} aria-hidden="true">
      <img src={a} alt="" loading="lazy" decoding="async" onError={() => setFailed(true)} />
      <img src={b} alt="" loading="lazy" decoding="async" className="demo-b" />
    </span>
  );

  if (size === "lg") return anim;

  return (
    <>
      <button type="button" className="demo-btn" onClick={() => setOpen(true)} aria-label={`הדגמה: ${name}`}>
        {anim}
      </button>
      {open && (
        <div className="demo-overlay" role="dialog" aria-modal="true" aria-label={name} onClick={() => setOpen(false)}>
          <div className="demo-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="row">
              <strong>{name}</strong>
              <button type="button" className="btn small" onClick={() => setOpen(false)}>סגור</button>
            </div>
            <span className="demo demo-xl" aria-hidden="true">
              <img src={a} alt="" />
              <img src={b} alt="" className="demo-b" />
            </span>
            <p className="meta">תנוחת התחלה ← תנוחת סיום, בלופ.</p>
          </div>
        </div>
      )}
    </>
  );
}
