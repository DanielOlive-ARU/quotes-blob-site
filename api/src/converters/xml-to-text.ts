import { XMLParser } from "fast-xml-parser";
import type { RouteDefinition, ValidationResult } from "../routing/route-types";
import { TEXT_PLAIN } from "../utils/content-types";

const parser = new XMLParser({
  ignoreAttributes: true,
  ignoreDeclaration: true,
  parseTagValue: false,
  trimValues: true
});

function getRootName(parsed: Record<string, unknown>): string | undefined {
  const keys = Object.keys(parsed);
  return keys[0];
}

function validate(input: string): ValidationResult {
  if (input.trim().length === 0) {
    return {
      ok: false,
      code: "INVALID_XML",
      message: "XML input is empty."
    };
  }
  let parsed: unknown;
  try {
    parsed = parser.parse(input);
  } catch (err) {
    return {
      ok: false,
      code: "INVALID_XML",
      message: "Input is not valid XML.",
      details: err instanceof Error ? err.message : undefined
    };
  }
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    Object.keys(parsed).length === 0
  ) {
    return {
      ok: false,
      code: "INVALID_XML",
      message: "XML document must contain a root element."
    };
  }
  return { ok: true };
}

function convert(input: string): string {
  const parsed = parser.parse(input) as Record<string, unknown>;
  const rootName = getRootName(parsed);
  if (!rootName) return "XML document was parsed successfully.";

  const rootNode = parsed[rootName];
  if (rootName === "student" && rootNode && typeof rootNode === "object") {
    const nodeRecord = rootNode as Record<string, unknown>;
    const name = nodeRecord.name;
    const course = nodeRecord.course;
    if (typeof name === "string" && typeof course === "string") {
      return `Student ${name} is enrolled on ${course}.`;
    }
  }
  return `XML document '${rootName}' was parsed successfully.`;
}

export const xmlToText: RouteDefinition = {
  key: "xml_to_text",
  label: "XML to plain text",
  description:
    "Summarise an XML document as plain text. If the document is <student> with <name> and <course> children, emit 'Student <name> is enrolled on <course>.'; otherwise emit a generic parse-success sentence naming the root element.",
  acceptedExtensions: [".xml"],
  acceptedMimeTypes: ["application/xml", "text/xml"],
  outputExtension: ".txt",
  outputMimeType: TEXT_PLAIN,
  exampleInput: "<student><name>Taylor</name><course>Cloud Platforms</course></student>",
  exampleOutput: "Student Taylor is enrolled on Cloud Platforms.",
  validate,
  convert
};
