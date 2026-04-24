import { describe, expect, it } from "vitest";
import { jsonToText } from "../../../src/converters/json-to-text";

describe("jsonToText converter", () => {
  describe("convert", () => {
    it("produces Key: Value lines for a flat object (happy path)", () => {
      const input = '{"name":"Jamie","course":"Cloud Platforms","level":5}';
      expect(jsonToText.convert(input)).toBe(
        "Name: Jamie\nCourse: Cloud Platforms\nLevel: 5"
      );
    });

    it("preserves insertion order of keys", () => {
      const input = '{"z":"last","a":"first","m":"middle"}';
      expect(jsonToText.convert(input)).toBe("Z: last\nA: first\nM: middle");
    });

    it("JSON-stringifies nested values", () => {
      const input = '{"name":"Jamie","tags":["a","b"],"meta":{"x":1}}';
      expect(jsonToText.convert(input)).toBe(
        'Name: Jamie\nTags: ["a","b"]\nMeta: {"x":1}'
      );
    });

    it("represents null as an empty value", () => {
      const input = '{"name":null}';
      expect(jsonToText.convert(input)).toBe("Name: ");
    });

    it("splits camelCase keys into spaced Title Case", () => {
      const input = '{"studentId":"abc","courseName":"Cloud"}';
      expect(jsonToText.convert(input)).toBe(
        "Student Id: abc\nCourse Name: Cloud"
      );
    });
  });

  describe("validate", () => {
    it("accepts a JSON object", () => {
      expect(jsonToText.validate('{"a":1}').ok).toBe(true);
    });

    it("rejects non-object JSON (arrays)", () => {
      const result = jsonToText.validate("[1,2,3]");
      expect(result.ok).toBe(false);
      expect(result.code).toBe("INVALID_JSON");
    });

    it("rejects invalid JSON", () => {
      const result = jsonToText.validate("not json");
      expect(result.ok).toBe(false);
      expect(result.code).toBe("INVALID_JSON");
    });
  });
});
