import type { RouteDefinition, ValidationResult } from "../routing/route-types";
import { TEXT_PLAIN } from "../utils/content-types";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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
      message: "Route json_to_keyvalue expects a JSON object at the top level."
    };
  }
  return { ok: true };
}

function convert(input: string): string {
  const parsed = JSON.parse(input) as Record<string, unknown>;
  const lines: string[] = [];
  for (const [key, value] of Object.entries(parsed)) {
    const raw = stringifyValue(value);
    lines.push(`${key}=${encodeURIComponent(raw)}`);
  }
  return lines.join("\n");
}

export const jsonToKeyvalue: RouteDefinition = {
  key: "json_to_keyvalue",
  label: "JSON to key=value",
  description:
    "Emit a JSON object as one 'key=value' line per top-level field. Values are URL-encoded so reserved characters are safe.",
  acceptedExtensions: [".json"],
  acceptedMimeTypes: ["application/json"],
  outputExtension: ".txt",
  outputMimeType: TEXT_PLAIN,
  exampleInput: '{ "name": "Student One", "city": "Peterborough" }',
  exampleOutput: "name=Student%20One\ncity=Peterborough",
  validate,
  convert
};
