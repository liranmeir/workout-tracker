"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/lib/actions";

export default function Nav() {
  const path = usePathname();
  const cur = (p: string) => (p === "/" ? path === "/" : path.startsWith(p)) ? "page" : undefined;
  return (
    <nav className="nav">
      <Link href="/" className="brand">יומן אימונים</Link>
      <Link href="/" className="tab" aria-current={cur("/")}>אימונים</Link>
      <Link href="/history" className="tab" aria-current={cur("/history")}>היסטוריה</Link>
      <form action={logoutAction}>
        <button className="tab" aria-label="התנתקות">יציאה</button>
      </form>
    </nav>
  );
}
