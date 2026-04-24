import { stringify } from "csv-stringify/sync";
import type { RouteDefinition, ValidationResult } from "../routing/route-types";
import { TEXT_CSV } from "../utils/content-types";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringifyCell(value: unknown): string {
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
  if (!Array.isArray(parsed)) {
    return {
      ok: false,
      code: "INVALID_JSON",
      message: "Route json_array_to_csv expects a JSON array at the top level."
    };
  }
  for (const item of parsed) {
    if (!isPlainObject(item)) {
      return {
        ok: false,
        code: "INVALID_JSON",
        message: "Every array item must be a non-null object."
      };
    }
  }
  return { ok: true };
}

function convert(input: string): string {
  const arr = JSON.parse(input) as Array<Record<string, unknown>>;
  const headers: string[] = [];
  for (const item of arr) {
    for (const key of Object.keys(item)) {
      if (!headers.includes(key)) headers.push(key);
    }
  }
  const rows = arr.map((item) =>
    headers.map((header) => stringifyCell(item[header]))
  );
  return stringify([headers, ...rows], { record_delimiter: "\n" });
}

export const jsonArrayToCsv: RouteDefinition = {
  key: "json_array_to_csv",
  label: "JSON array to CSV",
  description:
    "Emit a JSON array of objects as CSV. Columns are the union of keys in first-seen order. Missing values are left empty. Nested values are JSON-stringified.",
  acceptedExtensions: [".json"],
  acceptedMimeTypes: ["application/json"],
  outputExtension: ".csv",
  outputMimeType: TEXT_CSV,
  exampleInput: '[{ "name": "Alice", "score": 10 }, { "name": "Bob", "score": 12 }]',
  exampleOutput: "name,score\nAlice,10\nBob,12\n",
  validate,
  convert
};
