"use client";

import { useState } from "react";

// Submit button that needs a second tap within 3s.
export default function ConfirmButton({ label, confirm = "בטוח?" }: { label: string; confirm?: string }) {
  const [armed, setArmed] = useState(false);
  return (
    <button
      className={`btn small${armed ? " danger" : ""}`}
      onClick={(e) => {
        if (!armed) {
          e.preventDefault();
          setArmed(true);
          setTimeout(() => setArmed(false), 3000);
        }
      }}
    >
      {armed ? confirm : label}
    </button>
  );
}
