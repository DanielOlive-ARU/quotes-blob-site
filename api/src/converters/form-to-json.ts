import type { RouteDefinition, ValidationResult } from "../routing/route-types";
import { APPLICATION_JSON } from "../utils/content-types";

function parseForm(input: string): URLSearchParams {
  return new URLSearchParams(input.trim());
}

function validate(input: string): ValidationResult {
  const params = parseForm(input);
  const keys = Array.from(params.keys());
  if (keys.length === 0) {
    return {
      ok: false,
      code: "INVALID_FORM",
      message: "Input must contain at least one key=value pair."
    };
  }
  return { ok: true };
}

function convert(input: string): string {
  const params = parseForm(input);
  const result: Record<string, string | string[]> = {};
  const seenKeys: string[] = [];
  for (const key of params.keys()) {
    if (!seenKeys.includes(key)) seenKeys.push(key);
  }
  for (const key of seenKeys) {
    const values = params.getAll(key);
    result[key] = values.length === 1 ? values[0] : values;
  }
  return JSON.stringify(result);
}

export const formToJson: RouteDefinition = {
  key: "form_to_json",
  label: "URL-encoded form to JSON",
  description:
    "Parse URL-encoded form data (key=value&key=value) into a JSON object. Percent-encoded values are decoded. Repeated keys become arrays.",
  acceptedExtensions: [".txt", ".form"],
  acceptedMimeTypes: ["application/x-www-form-urlencoded", "text/plain"],
  outputExtension: ".json",
  outputMimeType: APPLICATION_JSON,
  exampleInput: "name=Student%20One&course=Cloud%20Platforms&level=5",
  exampleOutput:
    '{"name":"Student One","course":"Cloud Platforms","level":"5"}',
  validate,
  convert
};
