import { eq } from "drizzle-orm";
import { db } from "./db";
import { sessions } from "./schema";

/** Restart a session's elapsed-time clock from `now`. Logged sets and weights are kept. */
export async function restartSessionClock(sessionId: number, now: Date = new Date()) {
  if (!Number.isInteger(sessionId) || sessionId <= 0) return { error: "invalid session" };
  const rows = await db()
    .update(sessions)
    .set({ startedAt: now })
    .where(eq(sessions.id, sessionId))
    .returning({ startedAt: sessions.startedAt });
  if (!rows.length) return { error: `session ${sessionId} not found` };
  return { startedAt: now.toISOString() };
}
