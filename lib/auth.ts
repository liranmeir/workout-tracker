import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE = "wt_auth";

function token() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return createHmac("sha256", secret).update("workout-tracker:v1").digest("hex");
}

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export async function isAuthed() {
  const value = (await cookies()).get(COOKIE)?.value;
  return !!value && safeEqual(value, token());
}

export async function requireAuth() {
  if (!(await isAuthed())) redirect("/login");
}

export async function signIn(password: string) {
  const expected = process.env.APP_PASSWORD;
  if (!expected || !safeEqual(password, expected)) return false;
  (await cookies()).set(COOKIE, token(), {
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
