import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeDb } from "./helpers/fakeDb";

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

let fake = createFakeDb();
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies: async () => cookieJar }));
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("../db", () => ({ db: () => fake.db }));

import { currentUserId, isAuthed, requireUser, signIn, signOut } from "../auth";

beforeEach(() => {
  store.clear();
  vi.clearAllMocks();
  fake = createFakeDb();
  vi.stubEnv("AUTH_SECRET", "test-secret");
  vi.stubEnv("APP_PASSWORD", "hunter2");
  vi.stubEnv("APP_PASSWORD_ASI", "asi-pass");
});

describe("signIn", () => {
  it("rejects a wrong password and sets no cookie", async () => {
    expect(await signIn("liran", "nope")).toBe(false);
    expect(cookieJar.set).not.toHaveBeenCalled();
  });
  it("rejects another user's password", async () => {
    expect(await signIn("asi", "hunter2")).toBe(false);
    expect(await signIn("liran", "asi-pass")).toBe(false);
  });
  it("rejects a user with no password configured", async () => {
    expect(await signIn("noone", "")).toBe(false);
    expect(fake.calls).toHaveLength(0);
  });
  it("rejects a valid password when the user row is missing", async () => {
    fake.queue("select", []);
    expect(await signIn("asi", "asi-pass")).toBe(false);
  });
  it("sets an httpOnly cookie carrying the user id", async () => {
    fake.queue("select", [{ id: 2 }]);
    expect(await signIn("  ASI ", "asi-pass")).toBe(true);
    expect(cookieJar.set.mock.calls[0][2]).toMatchObject({ httpOnly: true, sameSite: "lax", path: "/" });
    expect(await currentUserId()).toBe(2);
    expect(await isAuthed()).toBe(true);
  });
});

describe("currentUserId / requireUser", () => {
  it("is null without a cookie and requireUser redirects to /login", async () => {
    expect(await currentUserId()).toBeNull();
    await expect(requireUser()).rejects.toThrow("REDIRECT:/login");
  });
  it("is null for a forged cookie", async () => {
    store.set("wt_auth", "forged");
    expect(await currentUserId()).toBeNull();
  });
  it("cannot switch users by editing the id in the cookie", async () => {
    fake.queue("select", [{ id: 2 }]);
    await signIn("asi", "asi-pass");
    store.set("wt_auth", store.get("wt_auth")!.replace(/^2\./, "1."));
    expect(await currentUserId()).toBeNull();
  });
  it("returns the id for a valid cookie", async () => {
    fake.queue("select", [{ id: 1 }]);
    await signIn("liran", "hunter2");
    expect(await requireUser()).toBe(1);
  });
  it("invalidates cookies when the secret changes", async () => {
    fake.queue("select", [{ id: 1 }]);
    await signIn("liran", "hunter2");
    vi.stubEnv("AUTH_SECRET", "other-secret");
    expect(await isAuthed()).toBe(false);
  });
  it("throws when AUTH_SECRET is missing", async () => {
    fake.queue("select", [{ id: 1 }]);
    vi.stubEnv("AUTH_SECRET", "");
    await expect(signIn("liran", "hunter2")).rejects.toThrow("AUTH_SECRET");
  });
});

describe("signOut", () => {
  it("removes the cookie", async () => {
    fake.queue("select", [{ id: 1 }]);
    await signIn("liran", "hunter2");
    await signOut();
    expect(await isAuthed()).toBe(false);
  });
});
