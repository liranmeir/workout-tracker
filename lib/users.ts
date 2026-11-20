import { timingSafeEqual } from "node:crypto";

/**
 * Users live in the `users` table; their secrets live in env vars so nothing secret is in the repo:
 *   APP_PASSWORD_<USERNAME>  – login password
 *   MCP_SECRET_<USERNAME>    – secret in the MCP URL (/api/mcp/<secret>)
 * The original user ("liran") also falls back to the old unsuffixed APP_PASSWORD / MCP_SECRET.
 */
export const LEGACY_USER = "liran";

export type Credential = "APP_PASSWORD" | "MCP_SECRET";

export function normalizeUsername(u: string | null | undefined) {
  return (u ?? "").trim().toLowerCase();
}

export function credentialFor(kind: Credential, username: string, env: Record<string, string | undefined> = process.env) {
  const u = normalizeUsername(username);
  if (!/^[a-z0-9_]+$/.test(u)) return undefined;
  const v = env[`${kind}_${u.toUpperCase()}`] || (u === LEGACY_USER ? env[kind] : undefined);
  return v || undefined;
}

export function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function passwordOk(username: string, password: string, env: Record<string, string | undefined> = process.env) {
  const expected = credentialFor("APP_PASSWORD", username, env);
  return !!expected && safeEqual(password, expected);
}

/** Which user (if any) owns this MCP URL key. Secrets shorter than 24 chars are ignored. */
export function userForMcpKey<U extends { username: string }>(
  key: string,
  list: U[],
  env: Record<string, string | undefined> = process.env,
): U | undefined {
  return list.find((u) => {
    const secret = credentialFor("MCP_SECRET", u.username, env);
    return !!secret && secret.length >= 24 && safeEqual(key, secret);
  });
}
