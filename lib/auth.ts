import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { users } from "./schema";
import { normalizeUsername, passwordOk, safeEqual } from "./users";

const COOKIE = "wt_auth";

function sign(userId: number) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return createHmac("sha256", secret).update(`workout-tracker:v2:${userId}`).digest("hex");
}

/** The logged-in user's id, or null. Cookie format: "<userId>.<hmac>". */
export async function currentUserId(): Promise<number | null> {
  const value = (await cookies()).get(COOKIE)?.value;
  const m = value?.match(/^(\d+)\.([0-9a-f]+)$/);
  if (!m) return null;
  const id = Number(m[1]);
  return safeEqual(m[2], sign(id)) ? id : null;
}

export async function isAuthed() {
  return (await currentUserId()) != null;
}

/** Returns the logged-in user's id, or redirects to /login. */
export async function requireUser(): Promise<number> {
  const id = await currentUserId();
  if (id == null) redirect("/login");
  return id;
}

export async function signIn(username: string, password: string) {
  const u = normalizeUsername(username);
  if (!u || !passwordOk(u, password)) return false;
  const [user] = await db().select({ id: users.id }).from(users).where(eq(users.username, u));
  if (!user) return false;
  (await cookies()).set(COOKIE, `${user.id}.${sign(user.id)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return true;
}

export async function signOut() {
  (await cookies()).delete(COOKIE);
}
