import { describe, expect, it } from "vitest";
import { listToJsonArray } from "../../../src/converters/list-to-json-array";

describe("listToJsonArray converter", () => {
  describe("convert", () => {
    it("produces a JSON array from newline-separated lines (happy path)", () => {
      expect(listToJsonArray.convert("apple\nbanana\norange")).toBe(
        '["apple","banana","orange"]'
      );
    });

    it("trims whitespace around each line", () => {
      expect(listToJsonArray.convert("  apple\n banana  \n\torange")).toBe(
        '["apple","banana","orange"]'
      );
    });

    it("ignores blank lines", () => {
      expect(listToJsonArray.convert("apple\n\nbanana\n   \norange")).toBe(
        '["apple","banana","orange"]'
      );
    });

    it("preserves item order", () => {
      expect(listToJsonArray.convert("z\na\nm")).toBe('["z","a","m"]');
    });

    it("handles a single item", () => {
      expect(listToJsonArray.convert("only")).toBe('["only"]');
    });

    it("handles CRLF line endings", () => {
      expect(listToJsonArray.convert("apple\r\nbanana\r\norange")).toBe(
        '["apple","banana","orange"]'
      );
    });
  });

  describe("validate", () => {
    it("accepts input with at least one non-empty line", () => {
      expect(listToJsonArray.validate("apple").ok).toBe(true);
    });

    it("rejects all-blank input", () => {
      const result = listToJsonArray.validate("\n\n   \n\t\n");
      expect(result.ok).toBe(false);
      expect(result.code).toBe("EMPTY_INPUT");
    });
  });
});
