import { describe, expect, it } from "vitest";
import { formToJson } from "../../../src/converters/form-to-json";

describe("formToJson converter", () => {
  describe("convert", () => {
    it("produces a JSON object from URL-encoded form data (happy path)", () => {
      expect(
        formToJson.convert(
          "name=Student%20One&course=Cloud%20Platforms&level=5"
        )
      ).toBe(
        '{"name":"Student One","course":"Cloud Platforms","level":"5"}'
      );
    });

    it("decodes percent-encoded values", () => {
      expect(formToJson.convert("email=s%40example.com")).toBe(
        '{"email":"s@example.com"}'
      );
    });

    it("treats plus signs as spaces", () => {
      expect(formToJson.convert("phrase=hello+world")).toBe(
        '{"phrase":"hello world"}'
      );
    });

    it("collects repeated keys into an array preserving order", () => {
      expect(formToJson.convert("tag=a&tag=b&tag=c")).toBe(
        '{"tag":["a","b","c"]}'
      );
    });

    it("preserves first-seen key order", () => {
      expect(formToJson.convert("z=1&a=2&m=3")).toBe(
        '{"z":"1","a":"2","m":"3"}'
      );
    });

    it("handles an empty value", () => {
      expect(formToJson.convert("key=")).toBe('{"key":""}');
    });
  });

  describe("validate", () => {
    it("accepts any input with at least one key", () => {
      expect(formToJson.validate("a=1").ok).toBe(true);
    });

    it("rejects empty input", () => {
      const result = formToJson.validate("");
      expect(result.ok).toBe(false);
      expect(result.code).toBe("INVALID_FORM");
    });

    it("rejects whitespace-only input", () => {
      const result = formToJson.validate("   \n\t");
      expect(result.ok).toBe(false);
      expect(result.code).toBe("INVALID_FORM");
    });
  });
});
