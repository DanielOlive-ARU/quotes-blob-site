import type { RouteDefinition, ValidationResult } from "../routing/route-types";
import { TEXT_HTML } from "../utils/content-types";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function toLabel(key: string): string {
  if (key.length === 0) return key;
  return key.charAt(0).toUpperCase() + key.slice(1);
}

function stringifyValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

function validate(input: string): ValidationResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch (err) {
    return {
      ok: false,
      code: "INVALID_JSON",
      message: "Input is not valid JSON.",
      details: err instanceof Error ? err.message : undefined
    };
  }
  if (!isPlainObject(parsed)) {
    return {
      ok: false,
      code: "INVALID_JSON",
      message: "Route json_to_html expects a JSON object at the top level."
    };
  }
  return { ok: true };
}

function convert(input: string): string {
  const parsed = JSON.parse(input) as Record<string, unknown>;
  const parts: string[] = [];

  if (parsed.title !== undefined) {
    parts.push(`<h1>${escapeHtml(stringifyValue(parsed.title))}</h1>`);
  }
  if (parsed.subtitle !== undefined) {
    parts.push(`<h2>${escapeHtml(stringifyValue(parsed.subtitle))}</h2>`);
  }
  for (const [key, value] of Object.entries(parsed)) {
    if (key === "title" || key === "subtitle") continue;
    const label = escapeHtml(toLabel(key));
    const text = escapeHtml(stringifyValue(value));
    parts.push(`<p><strong>${label}:</strong> ${text}</p>`);
  }
  return parts.join("\n");
}

export const jsonToHtml: RouteDefinition = {
  key: "json_to_html",
  label: "JSON to HTML snippet",
  description:
    "Render a JSON object as an HTML snippet. 'title' becomes an <h1>, 'subtitle' an <h2>, and all other primitive fields become <p><strong>Key:</strong> Value</p> paragraphs. HTML special characters are escaped.",
  acceptedExtensions: [".json"],
  acceptedMimeTypes: ["application/json"],
  outputExtension: ".html",
  outputMimeType: TEXT_HTML,
  exampleInput: '{ "title": "Hello", "description": "Welcome to the app" }',
  exampleOutput:
    "<h1>Hello</h1>\n<p><strong>Description:</strong> Welcome to the app</p>",
  validate,
  convert
};
