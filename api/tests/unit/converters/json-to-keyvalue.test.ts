import { describe, expect, it } from "vitest";
import { jsonToKeyvalue } from "../../../src/converters/json-to-keyvalue";

describe("jsonToKeyvalue converter", () => {
  describe("convert", () => {
    it("produces key=value lines for a flat object (happy path)", () => {
      expect(
        jsonToKeyvalue.convert(
          '{"name":"Student One","city":"Peterborough"}'
        )
      ).toBe("name=Student%20One\ncity=Peterborough");
    });

    it("URL-encodes reserved characters in values", () => {
      expect(
        jsonToKeyvalue.convert(
          '{"query":"a=b&c","path":"/api/convert"}'
        )
      ).toBe("query=a%3Db%26c\npath=%2Fapi%2Fconvert");
    });

    it("preserves insertion order of keys", () => {
      expect(jsonToKeyvalue.convert('{"z":"1","a":"2","m":"3"}')).toBe(
        "z=1\na=2\nm=3"
      );
    });

    it("stringifies numbers and booleans", () => {
      expect(jsonToKeyvalue.convert('{"count":5,"active":true}')).toBe(
        "count=5\nactive=true"
      );
    });

    it("JSON-stringifies nested objects and arrays (then URL-encodes the result)", () => {
      expect(jsonToKeyvalue.convert('{"tags":["a","b"]}')).toBe(
        "tags=%5B%22a%22%2C%22b%22%5D"
      );
    });

    it("represents null as an empty value", () => {
      expect(jsonToKeyvalue.convert('{"name":null}')).toBe("name=");
    });
  });

  describe("validate", () => {
    it("accepts a JSON object", () => {
      expect(jsonToKeyvalue.validate('{"a":1}').ok).toBe(true);
    });

    it("rejects non-object JSON (arrays)", () => {
      const result = jsonToKeyvalue.validate("[1,2,3]");
      expect(result.ok).toBe(false);
      expect(result.code).toBe("INVALID_JSON");
    });

    it("rejects invalid JSON", () => {
      const result = jsonToKeyvalue.validate("not json");
      expect(result.ok).toBe(false);
      expect(result.code).toBe("INVALID_JSON");
    });
  });
});
