import type { RouteDefinition, ValidationResult } from "../routing/route-types";
import { APPLICATION_JSON } from "../utils/content-types";

function splitLines(input: string): string[] {
  return input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function validate(input: string): ValidationResult {
  if (splitLines(input).length === 0) {
    return {
      ok: false,
      code: "EMPTY_INPUT",
      message: "At least one non-empty line is required."
    };
  }
  return { ok: true };
}

function convert(input: string): string {
  return JSON.stringify(splitLines(input));
}

export const listToJsonArray: RouteDefinition = {
  key: "list_to_json_array",
  label: "Text list to JSON array",
  description:
    "Split newline-separated text into a JSON array of trimmed strings. Blank lines are ignored and order is preserved.",
  acceptedExtensions: [".txt"],
  acceptedMimeTypes: ["text/plain"],
  outputExtension: ".json",
  outputMimeType: APPLICATION_JSON,
  exampleInput: "apple\nbanana\norange",
  exampleOutput: '["apple","banana","orange"]',
  validate,
  convert
};
