import { beforeEach, describe, expect, it, vi } from "vitest";

const { store, cookieJar, redirect } = vi.hoisted(() => {
  const store = new Map<string, string>();
  return {
    store,
    cookieJar: {
      get: (k: string) => (store.has(k) ? { value: store.get(k)! } : undefined),
      set: vi.fn((k: string, v: string, _opts?: Record<string, unknown>) => void store.set(k, v)),
      delete: vi.fn((k: string) => void store.delete(k)),
    },
    redirect: vi.fn((to: string) => {
      throw new Error(`REDIRECT:${to}`);
    }),
  };
});

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies: async () => cookieJar }));
vi.mock("next/navigation", () => ({ redirect }));

import { isAuthed, requireAuth, signIn, signOut } from "../auth";

beforeEach(() => {
  store.clear();
  vi.clearAllMocks();
  vi.stubEnv("AUTH_SECRET", "test-secret");
  vi.stubEnv("APP_PASSWORD", "hunter2");
});

describe("signIn", () => {
  it("rejects a wrong password and sets no cookie", async () => {
    expect(await signIn("nope")).toBe(false);
    expect(cookieJar.set).not.toHaveBeenCalled();
  });
  it("rejects everything when APP_PASSWORD is unset", async () => {
    vi.stubEnv("APP_PASSWORD", "");
    expect(await signIn("")).toBe(false);
  });
  it("sets an httpOnly cookie on success and then isAuthed is true", async () => {
    expect(await signIn("hunter2")).toBe(true);
    expect(cookieJar.set.mock.calls[0][2]).toMatchObject({ httpOnly: true, sameSite: "lax", path: "/" });
    expect(await isAuthed()).toBe(true);
  });
});

describe("isAuthed / requireAuth", () => {
  it("is false without a cookie and requireAuth redirects to /login", async () => {
    expect(await isAuthed()).toBe(false);
    await expect(requireAuth()).rejects.toThrow("REDIRECT:/login");
  });
  it("is false for a forged cookie", async () => {
    store.set("wt_auth", "forged");
    expect(await isAuthed()).toBe(false);
  });
  it("invalidates cookies when the secret changes", async () => {
    await signIn("hunter2");
    vi.stubEnv("AUTH_SECRET", "other-secret");
    expect(await isAuthed()).toBe(false);
  });
  it("throws when AUTH_SECRET is missing", async () => {
    vi.stubEnv("AUTH_SECRET", "");
    await expect(signIn("hunter2")).rejects.toThrow("AUTH_SECRET");
  });
});

describe("signOut", () => {
  it("removes the cookie", async () => {
    await signIn("hunter2");
    await signOut();
    expect(await isAuthed()).toBe(false);
  });
});
