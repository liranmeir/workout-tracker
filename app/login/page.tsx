"use client";

import { useActionState } from "react";
import { loginAction } from "@/lib/actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, null);
  return (
    <div className="login">
      <form action={action}>
        <h1>יומן אימונים</h1>
        <label className="f">
          שם משתמש
          <input name="username" type="text" autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} dir="ltr" required autoFocus />
        </label>
        <label className="f">
          סיסמה
          <input name="password" type="password" autoComplete="current-password" required />
        </label>
        {state?.error && <p className="error">{state.error}</p>}
        <button className="btn primary" disabled={pending}>
          {pending ? "נכנס…" : "כניסה"}
        </button>
      </form>
    </div>
  );
}
