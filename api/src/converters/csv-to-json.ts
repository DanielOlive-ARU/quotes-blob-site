import { parse } from "csv-parse/sync";
import type { RouteDefinition, ValidationResult } from "../routing/route-types";
import { APPLICATION_JSON } from "../utils/content-types";

function parseCsv(input: string): string[][] {
  return parse(input, { skip_empty_lines: true, trim: false });
}

function validate(input: string): ValidationResult {
  let rows: string[][];
  try {
    rows = parseCsv(input);
  } catch (err) {
    return {
      ok: false,
      code: "INVALID_CSV",
      message: "Input is not valid CSV.",
      details: err instanceof Error ? err.message : undefined
    };
  }
  if (rows.length < 2) {
    return {
      ok: false,
      code: "INVALID_CSV",
      message: "Input must contain a header row and exactly one data row."
    };
  }
  if (rows.length > 2) {
    return {
      ok: false,
      code: "INVALID_CSV",
      message: "Input must contain exactly one data row.",
      details: `Received ${rows.length - 1} data rows.`
    };
  }
  if (rows[0].some((h) => h.trim() === "")) {
    return {
      ok: false,
      code: "INVALID_CSV",
      message: "Header row must not contain empty column names."
    };
  }
  return { ok: true };
}

function convert(input: string): string {
  const rows = parseCsv(input);
  const [headers, values] = rows;
  const obj: Record<string, string> = {};
  headers.forEach((header, i) => {
    obj[header] = values[i] !== undefined ? values[i] : "";
  });
  return JSON.stringify(obj);
}

export const csvToJson: RouteDefinition = {
  key: "csv_to_json",
  label: "CSV row to JSON",
  description:
    "Parse a CSV with exactly one header row and one data row into a JSON object. Values remain strings. Quoted fields with commas are handled.",
  acceptedExtensions: [".csv"],
  acceptedMimeTypes: ["text/csv"],
  outputExtension: ".json",
  outputMimeType: APPLICATION_JSON,
  exampleInput: "name,course,level\nStudent One,Cloud Platforms,5",
  exampleOutput:
    '{"name":"Student One","course":"Cloud Platforms","level":"5"}',
  validate,
  convert
};
