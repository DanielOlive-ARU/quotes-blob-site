import { describe, expect, it } from "vitest";
import { xmlToText } from "../../../src/converters/xml-to-text";

describe("xmlToText converter", () => {
  describe("convert", () => {
    it("renders the student/name/course template (happy path)", () => {
      expect(
        xmlToText.convert(
          "<student><name>Taylor</name><course>Cloud Platforms</course></student>"
        )
      ).toBe("Student Taylor is enrolled on Cloud Platforms.");
    });

    it("falls back to a generic summary when the root is not 'student'", () => {
      expect(
        xmlToText.convert("<book><title>A Book</title></book>")
      ).toBe("XML document 'book' was parsed successfully.");
    });

    it("falls back when 'student' is missing 'name' or 'course'", () => {
      expect(
        xmlToText.convert("<student><name>Taylor</name></student>")
      ).toBe("XML document 'student' was parsed successfully.");
    });

    it("ignores the XML declaration", () => {
      expect(
        xmlToText.convert(
          '<?xml version="1.0"?><student><name>Taylor</name><course>Cloud Platforms</course></student>'
        )
      ).toBe("Student Taylor is enrolled on Cloud Platforms.");
    });

    it("handles self-closing root elements", () => {
      expect(xmlToText.convert("<empty/>")).toBe(
        "XML document 'empty' was parsed successfully."
      );
    });
  });

  describe("validate", () => {
    it("accepts a valid XML document", () => {
      expect(xmlToText.validate("<root>value</root>").ok).toBe(true);
    });

    it("rejects empty input", () => {
      const result = xmlToText.validate("");
      expect(result.ok).toBe(false);
      expect(result.code).toBe("INVALID_XML");
    });

    it("rejects whitespace-only input", () => {
      const result = xmlToText.validate("   \n\t");
      expect(result.ok).toBe(false);
      expect(result.code).toBe("INVALID_XML");
    });
  });
});
