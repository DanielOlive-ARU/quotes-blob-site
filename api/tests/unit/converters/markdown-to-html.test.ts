import { describe, expect, it } from "vitest";
import { markdownToHtml } from "../../../src/converters/markdown-to-html";

describe("markdownToHtml converter", () => {
  describe("convert", () => {
    it("renders heading + paragraph (happy path)", () => {
      expect(
        markdownToHtml.convert("# Title\nThis is a paragraph.")
      ).toBe("<h1>Title</h1>\n<p>This is a paragraph.</p>");
    });

    it("renders emphasis", () => {
      const output = markdownToHtml.convert("This is *italic* and **bold**.");
      expect(output).toContain("<em>italic</em>");
      expect(output).toContain("<strong>bold</strong>");
    });

    it("renders inline code", () => {
      expect(markdownToHtml.convert("Use `npm ci` to install.")).toContain(
        "<code>npm ci</code>"
      );
    });

    it("renders unordered lists", () => {
      const output = markdownToHtml.convert("- one\n- two\n- three");
      expect(output).toContain("<ul>");
      expect(output).toContain("<li>one</li>");
      expect(output).toContain("<li>three</li>");
    });

    it("renders ordered lists", () => {
      const output = markdownToHtml.convert("1. first\n2. second");
      expect(output).toContain("<ol>");
      expect(output).toContain("<li>first</li>");
    });

    it("trims trailing whitespace from output", () => {
      const output = markdownToHtml.convert("# Hello");
      expect(output).toBe("<h1>Hello</h1>");
    });
  });

  describe("validate", () => {
    it("accepts non-empty markdown", () => {
      expect(markdownToHtml.validate("# Hello").ok).toBe(true);
    });

    it("rejects empty input", () => {
      const result = markdownToHtml.validate("");
      expect(result.ok).toBe(false);
      expect(result.code).toBe("EMPTY_INPUT");
    });

    it("rejects whitespace-only input", () => {
      const result = markdownToHtml.validate("   \n\t\n");
      expect(result.ok).toBe(false);
      expect(result.code).toBe("EMPTY_INPUT");
    });
  });
});
