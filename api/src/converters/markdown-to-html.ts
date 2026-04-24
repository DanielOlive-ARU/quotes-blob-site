import { marked } from "marked";
import type { RouteDefinition, ValidationResult } from "../routing/route-types";
import { TEXT_HTML } from "../utils/content-types";

function validate(input: string): ValidationResult {
  if (input.trim().length === 0) {
    return {
      ok: false,
      code: "EMPTY_INPUT",
      message: "Markdown input must contain non-whitespace content."
    };
  }
  return { ok: true };
}

function convert(input: string): string {
  const html = marked.parse(input, { async: false });
  return String(html).trim();
}

export const markdownToHtml: RouteDefinition = {
  key: "markdown_to_html",
  label: "Markdown to HTML",
  description:
    "Render Markdown as an HTML snippet. Supports headings, paragraphs, emphasis, code, and lists. The output is snippet HTML without a full page wrapper.",
  acceptedExtensions: [".md", ".markdown", ".txt"],
  acceptedMimeTypes: ["text/markdown", "text/plain"],
  outputExtension: ".html",
  outputMimeType: TEXT_HTML,
  exampleInput: "# Title\nThis is a paragraph.",
  exampleOutput: "<h1>Title</h1>\n<p>This is a paragraph.</p>",
  validate,
  convert
};
