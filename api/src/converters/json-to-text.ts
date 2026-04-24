import type { RouteDefinition, ValidationResult } from "../routing/route-types";
import { TEXT_PLAIN } from "../utils/content-types";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toDisplayKey(key: string): string {
  const parts = key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(/\s+/);
  return parts
    .map((p) => (p ? p[0].toUpperCase() + p.slice(1) : ""))
    .join(" ");
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
      message: "Route json_to_text expects a JSON object at the top level."
    };
  }
  return { ok: true };
}

function convert(input: string): string {
  const parsed = JSON.parse(input) as Record<string, unknown>;
  const lines: string[] = [];
  for (const [key, value] of Object.entries(parsed)) {
    lines.push(`${toDisplayKey(key)}: ${stringifyValue(value)}`);
  }
  return lines.join("\n");
}

export const jsonToText: RouteDefinition = {
  key: "json_to_text",
  label: "JSON to plain text",
  description:
    "Flatten a JSON object into one 'Key: Value' line per top-level field. Nested values are JSON-stringified.",
  acceptedExtensions: [".json"],
  acceptedMimeTypes: ["application/json"],
  outputExtension: ".txt",
  outputMimeType: TEXT_PLAIN,
  exampleInput: '{ "name": "Jamie", "course": "Cloud Platforms", "level": 5 }',
  exampleOutput: "Name: Jamie\nCourse: Cloud Platforms\nLevel: 5",
  validate,
  convert
};
