import { describe, expect, it } from "vitest";
import { mediaFrames } from "../media";

describe("mediaFrames", () => {
  it("self-hosts seeded exercises", () => {
    expect(mediaFrames("Plank")).toEqual(["/demos/Plank/0.jpg", "/demos/Plank/1.jpg"]);
  });
  it("loads other exercises from the pinned remote", () => {
    const [a] = mediaFrames("Barbell_Curl");
    expect(a).toMatch(/^https:\/\/raw\.githubusercontent\.com\/yuhonas\/free-exercise-db\/[0-9a-f]{40}\/exercises\/Barbell_Curl\/0\.jpg$/);
  });
  it("encodes unsafe ids", () => {
    expect(mediaFrames("a/b")[0]).toContain("a%2Fb");
  });
});
