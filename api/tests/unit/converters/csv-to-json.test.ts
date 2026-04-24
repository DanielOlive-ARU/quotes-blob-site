import { describe, expect, it } from "vitest";
import { csvToJson } from "../../../src/converters/csv-to-json";

describe("csvToJson converter", () => {
  describe("convert", () => {
    it("produces a JSON object from a header row + data row (happy path)", () => {
      expect(
        csvToJson.convert("name,course,level\nStudent One,Cloud Platforms,5")
      ).toBe(
        '{"name":"Student One","course":"Cloud Platforms","level":"5"}'
      );
    });

    it("handles commas inside quoted fields", () => {
      expect(
        csvToJson.convert('last_name,first_name\n"Smith, Jr.",Alex')
      ).toBe('{"last_name":"Smith, Jr.","first_name":"Alex"}');
    });

    it("handles escaped quotes inside quoted fields", () => {
      expect(csvToJson.convert('quote\n"She said ""hi"""')).toBe(
        '{"quote":"She said \\"hi\\""}'
      );
    });

    it("keeps all values as strings", () => {
      expect(csvToJson.convert("a,b\n1,2")).toBe('{"a":"1","b":"2"}');
    });
  });

  describe("validate", () => {
    it("accepts a header row + exactly one data row", () => {
      expect(csvToJson.validate("a,b\n1,2").ok).toBe(true);
    });

    it("rejects input with no data row", () => {
      const result = csvToJson.validate("a,b");
      expect(result.ok).toBe(false);
      expect(result.code).toBe("INVALID_CSV");
    });

    it("rejects input with more than one data row", () => {
      const result = csvToJson.validate("a,b\n1,2\n3,4");
      expect(result.ok).toBe(false);
      expect(result.code).toBe("INVALID_CSV");
    });

    it("rejects a header row with an empty column name", () => {
      const result = csvToJson.validate("a,,c\n1,2,3");
      expect(result.ok).toBe(false);
      expect(result.code).toBe("INVALID_CSV");
    });
  });
});
