import { describe, expect, it } from "vitest";
import { credentialFor, normalizeUsername, passwordOk, userForMcpKey } from "../users";

const env = {
  APP_PASSWORD: "legacy-pass",
  MCP_SECRET: "legacy-secret-legacy-secret-1234",
  APP_PASSWORD_ASI: "asi-pass",
  MCP_SECRET_ASI: "asi-secret-asi-secret-asi-secret",
  MCP_SECRET_SHORT: "too-short",
};

describe("normalizeUsername", () => {
  it("trims and lowercases", () => expect(normalizeUsername("  Asi ")).toBe("asi"));
  it("handles null", () => expect(normalizeUsername(null)).toBe(""));
});

describe("credentialFor", () => {
  it("reads the suffixed env var", () => expect(credentialFor("APP_PASSWORD", "asi", env)).toBe("asi-pass"));
  it("falls back to the unsuffixed var only for liran", () => {
    expect(credentialFor("APP_PASSWORD", "liran", env)).toBe("legacy-pass");
    expect(credentialFor("APP_PASSWORD", "bob", env)).toBeUndefined();
  });
  it("prefers the suffixed var for liran too", () =>
    expect(credentialFor("APP_PASSWORD", "liran", { ...env, APP_PASSWORD_LIRAN: "new" })).toBe("new"));
  it("rejects usernames that could reach other env vars", () => {
    expect(credentialFor("APP_PASSWORD", "", env)).toBeUndefined();
    expect(credentialFor("APP_PASSWORD", "a-b", env)).toBeUndefined();
  });
  it("treats an empty value as unset", () => expect(credentialFor("APP_PASSWORD", "asi", { APP_PASSWORD_ASI: "" })).toBeUndefined());
});

describe("passwordOk", () => {
  it("accepts only the user's own password", () => {
    expect(passwordOk("asi", "asi-pass", env)).toBe(true);
    expect(passwordOk("asi", "legacy-pass", env)).toBe(false);
    expect(passwordOk("liran", "legacy-pass", env)).toBe(true);
  });
  it("rejects everything when no password is configured", () => expect(passwordOk("bob", "", env)).toBe(false));
});

describe("userForMcpKey", () => {
  const list = [{ id: 1, username: "liran" }, { id: 2, username: "asi" }, { id: 3, username: "short" }];
  it("maps each secret to its own user", () => {
    expect(userForMcpKey(env.MCP_SECRET, list, env)?.id).toBe(1);
    expect(userForMcpKey(env.MCP_SECRET_ASI, list, env)?.id).toBe(2);
  });
  it("returns undefined for an unknown key", () => expect(userForMcpKey("x".repeat(32), list, env)).toBeUndefined());
  it("ignores secrets shorter than 24 chars", () => expect(userForMcpKey("too-short", list, env)).toBeUndefined());
});
