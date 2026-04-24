import { XMLBuilder } from "fast-xml-parser";
import type { RouteDefinition, ValidationResult } from "../routing/route-types";
import { APPLICATION_XML } from "../utils/content-types";

const DEFAULT_ROOT = "root";
const VALID_ROOT_PATTERN = /^[A-Za-z_][A-Za-z0-9_\-.]*$/;

function wrapArraysAsItems(value: unknown): unknown {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) {
    return { item: value.map(wrapArraysAsItems) };
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, inner] of Object.entries(value as Record<string, unknown>)) {
      out[key] = wrapArraysAsItems(inner);
    }
    return out;
  }
  return value;
}

function validate(input: string): ValidationResult {
  try {
    JSON.parse(input);
  } catch (err) {
    return {
      ok: false,
      code: "INVALID_JSON",
      message: "Input is not valid JSON.",
      details: err instanceof Error ? err.message : undefined
    };
  }
  return { ok: true };
}

function convert(input: string, options?: Record<string, unknown>): string {
  const parsed: unknown = JSON.parse(input);
  const requestedRoot =
    options && typeof options.rootElement === "string" ? options.rootElement : undefined;
  const root =
    requestedRoot && VALID_ROOT_PATTERN.test(requestedRoot)
      ? requestedRoot
      : DEFAULT_ROOT;

  const builder = new XMLBuilder({
    format: false,
    ignoreAttributes: true,
    suppressEmptyNode: false
  });

  const wrapped = wrapArraysAsItems(parsed);
  const document = { [root]: wrapped };
  return builder.build(document);
}

export const jsonToXml: RouteDefinition = {
  key: "json_to_xml",
  label: "JSON to XML",
  description:
    "Build deterministic XML from a JSON value. Default root element is 'root' and can be overridden via options.rootElement. Arrays become repeated <item> children. Null values become empty elements. XML special characters are escaped automatically.",
  acceptedExtensions: [".json"],
  acceptedMimeTypes: ["application/json"],
  outputExtension: ".xml",
  outputMimeType: APPLICATION_XML,
  exampleInput: '{ "name": "Taylor", "course": "Cloud Platforms" }',
  exampleOutput: "<root><name>Taylor</name><course>Cloud Platforms</course></root>",
  validate,
  convert
};
