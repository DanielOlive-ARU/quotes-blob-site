import { describe, expect, it } from "vitest";
import { jsonToXml } from "../../../src/converters/json-to-xml";

describe("jsonToXml converter", () => {
  describe("convert", () => {
    it("uses options.rootElement when provided (happy path)", () => {
      expect(
        jsonToXml.convert(
          '{"name":"Taylor","course":"Cloud Platforms"}',
          { rootElement: "student" }
        )
      ).toBe(
        "<student><name>Taylor</name><course>Cloud Platforms</course></student>"
      );
    });

    it("defaults the root element to 'root'", () => {
      expect(jsonToXml.convert('{"a":1,"b":2}')).toBe(
        "<root><a>1</a><b>2</b></root>"
      );
    });

    it("falls back to 'root' when rootElement is invalid", () => {
      expect(
        jsonToXml.convert('{"a":1}', { rootElement: "123bad!" })
      ).toBe("<root><a>1</a></root>");
    });

    it("emits arrays as repeated <item> children", () => {
      expect(jsonToXml.convert('{"tags":["a","b","c"]}')).toBe(
        "<root><tags><item>a</item><item>b</item><item>c</item></tags></root>"
      );
    });

    it("emits null as an empty element", () => {
      const output = jsonToXml.convert('{"name":null}');
      expect(output === "<root><name></name></root>" || output === "<root><name/></root>").toBe(true);
    });

    it("escapes XML special characters in text content", () => {
      expect(jsonToXml.convert('{"note":"a < b & c"}')).toBe(
        "<root><note>a &lt; b &amp; c</note></root>"
      );
    });

    it("stringifies numbers and booleans", () => {
      expect(jsonToXml.convert('{"count":5,"active":true}')).toBe(
        "<root><count>5</count><active>true</active></root>"
      );
    });

    it("handles nested objects", () => {
      expect(
        jsonToXml.convert('{"student":{"name":"Taylor"}}')
      ).toBe("<root><student><name>Taylor</name></student></root>");
    });
  });

  describe("validate", () => {
    it("accepts valid JSON of any shape", () => {
      expect(jsonToXml.validate('{"a":1}').ok).toBe(true);
      expect(jsonToXml.validate('[1,2,3]').ok).toBe(true);
      expect(jsonToXml.validate('"a string"').ok).toBe(true);
    });

    it("rejects invalid JSON", () => {
      const result = jsonToXml.validate("not json");
      expect(result.ok).toBe(false);
      expect(result.code).toBe("INVALID_JSON");
    });
  });
});
