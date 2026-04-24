import { describe, expect, it } from "vitest";
import { buildBlobName, isoTimestamp } from "../../../src/utils/timestamp";

describe("isoTimestamp", () => {
  it("formats a fixed date as YYYY-MM-DDTHH-MM-SS", () => {
    const fixed = new Date("2026-04-24T12:00:00Z");
    expect(isoTimestamp(fixed)).toBe("2026-04-24T12-00-00");
  });

  it("pads single-digit components", () => {
    const stamp = isoTimestamp(new Date("2026-01-02T03:04:05Z"));
    expect(stamp).toBe("2026-01-02T03-04-05");
  });

  it("produces a filename-safe string (no slashes or colons)", () => {
    const stamp = isoTimestamp(new Date("2026-01-01T01:02:03Z"));
    expect(stamp).not.toMatch(/[\/:]/);
  });
});

describe("buildBlobName", () => {
  it("assembles an originals path", () => {
    expect(
      buildBlobName(
        "originals",
        "json_to_text",
        "student.json",
        "2026-04-24T12-00-00"
      )
    ).toBe("originals/json_to_text/2026-04-24T12-00-00_student.json");
  });

  it("assembles a converted path", () => {
    expect(
      buildBlobName(
        "converted",
        "json_to_text",
        "student.txt",
        "2026-04-24T12-00-00"
      )
    ).toBe("converted/json_to_text/2026-04-24T12-00-00_student.txt");
  });
});
