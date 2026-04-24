import { describe, expect, it } from "vitest";
import { jsonArrayToCsv } from "../../../src/converters/json-array-to-csv";

describe("jsonArrayToCsv converter", () => {
  describe("convert", () => {
    it("produces CSV from an array of flat objects (happy path)", () => {
      expect(
        jsonArrayToCsv.convert(
          '[{"name":"Alice","score":10},{"name":"Bob","score":12}]'
        )
      ).toBe("name,score\nAlice,10\nBob,12\n");
    });

    it("uses the union of keys in first-seen order", () => {
      expect(
        jsonArrayToCsv.convert('[{"a":1,"b":2},{"b":3,"c":4}]')
      ).toBe("a,b,c\n1,2,\n,3,4\n");
    });

    it("leaves missing fields as empty cells", () => {
      expect(jsonArrayToCsv.convert('[{"a":1},{"b":2}]')).toBe(
        "a,b\n1,\n,2\n"
      );
    });

    it("JSON-stringifies nested values", () => {
      expect(
        jsonArrayToCsv.convert('[{"tags":["x","y"]}]')
      ).toBe('tags\n"[""x"",""y""]"\n');
    });

    it("quotes fields containing commas", () => {
      expect(
        jsonArrayToCsv.convert('[{"name":"Smith, Jr."}]')
      ).toBe('name\n"Smith, Jr."\n');
    });

    it("represents null as empty", () => {
      expect(jsonArrayToCsv.convert('[{"a":null}]')).toBe("a\n\n");
    });
  });

  describe("validate", () => {
    it("accepts an array of objects", () => {
      expect(jsonArrayToCsv.validate('[{"a":1}]').ok).toBe(true);
    });

    it("rejects invalid JSON", () => {
      const result = jsonArrayToCsv.validate("not json");
      expect(result.ok).toBe(false);
      expect(result.code).toBe("INVALID_JSON");
    });

    it("rejects a top-level object (not an array)", () => {
      const result = jsonArrayToCsv.validate('{"a":1}');
      expect(result.ok).toBe(false);
      expect(result.code).toBe("INVALID_JSON");
    });

    it("rejects an array containing a non-object item", () => {
      const result = jsonArrayToCsv.validate('[{"a":1},"oops"]');
      expect(result.ok).toBe(false);
      expect(result.code).toBe("INVALID_JSON");
    });

    it("rejects an array containing null", () => {
      const result = jsonArrayToCsv.validate('[{"a":1},null]');
      expect(result.ok).toBe(false);
      expect(result.code).toBe("INVALID_JSON");
    });
  });
});
