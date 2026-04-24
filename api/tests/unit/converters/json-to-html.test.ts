import { describe, expect, it } from "vitest";
import { jsonToHtml } from "../../../src/converters/json-to-html";

describe("jsonToHtml converter", () => {
  describe("convert", () => {
    it("renders title + description (happy path)", () => {
      expect(
        jsonToHtml.convert(
          '{"title":"Hello","description":"Welcome to the app"}'
        )
      ).toBe(
        "<h1>Hello</h1>\n<p><strong>Description:</strong> Welcome to the app</p>"
      );
    });

    it("renders subtitle as h2", () => {
      expect(
        jsonToHtml.convert('{"title":"Big","subtitle":"Small","body":"text"}')
      ).toBe(
        "<h1>Big</h1>\n<h2>Small</h2>\n<p><strong>Body:</strong> text</p>"
      );
    });

    it("escapes HTML special characters in values", () => {
      expect(
        jsonToHtml.convert(
          '{"title":"<script>alert(1)</script>","note":"a & b"}'
        )
      ).toBe(
        "<h1>&lt;script&gt;alert(1)&lt;/script&gt;</h1>\n<p><strong>Note:</strong> a &amp; b</p>"
      );
    });

    it("JSON-stringifies nested values in paragraph content", () => {
      expect(
        jsonToHtml.convert('{"items":["a","b"]}')
      ).toBe('<p><strong>Items:</strong> [&quot;a&quot;,&quot;b&quot;]</p>');
    });

    it("renders without title or subtitle", () => {
      expect(jsonToHtml.convert('{"name":"Alice"}')).toBe(
        "<p><strong>Name:</strong> Alice</p>"
      );
    });

    it("represents null as an empty value", () => {
      expect(jsonToHtml.convert('{"note":null}')).toBe(
        "<p><strong>Note:</strong> </p>"
      );
    });
  });

  describe("validate", () => {
    it("accepts a JSON object", () => {
      expect(jsonToHtml.validate('{"a":1}').ok).toBe(true);
    });

    it("rejects a JSON array at the top level", () => {
      const result = jsonToHtml.validate("[1,2,3]");
      expect(result.ok).toBe(false);
      expect(result.code).toBe("INVALID_JSON");
    });

    it("rejects invalid JSON", () => {
      const result = jsonToHtml.validate("nope");
      expect(result.ok).toBe(false);
      expect(result.code).toBe("INVALID_JSON");
    });
  });
});
