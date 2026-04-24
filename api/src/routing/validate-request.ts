import { getRouteDefinition, isRouteImplemented } from "./route-metadata";
import type { ConvertRequest, ValidationResult } from "./route-types";

const DEFAULT_MAX_INPUT_BYTES = 200_000;

function getMaxInputBytes(): number {
  const raw = process.env.MAX_INPUT_BYTES;
  if (!raw) return DEFAULT_MAX_INPUT_BYTES;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_MAX_INPUT_BYTES;
}

function extensionOf(filename: string): string {
  const idx = filename.lastIndexOf(".");
  return idx >= 0 ? filename.slice(idx).toLowerCase() : "";
}

export interface RequestShapeResult extends ValidationResult {
  parsed?: ConvertRequest;
}

export function validateRequestShape(body: unknown): RequestShapeResult {
  if (typeof body !== "object" || body === null) {
    return {
      ok: false,
      code: "INVALID_INPUT",
      message: "Request body must be a JSON object."
    };
  }
  const b = body as Record<string, unknown>;
  if (typeof b.route !== "string" || b.route.length === 0) {
    return { ok: false, code: "INVALID_INPUT", message: "'route' is required." };
  }
  if (typeof b.filename !== "string" || b.filename.length === 0) {
    return { ok: false, code: "INVALID_INPUT", message: "'filename' is required." };
  }
  if (typeof b.text !== "string") {
    return { ok: false, code: "INVALID_INPUT", message: "'text' is required and must be a string." };
  }
  return {
    ok: true,
    parsed: {
      route: b.route as ConvertRequest["route"],
      filename: b.filename,
      text: b.text,
      contentType: typeof b.contentType === "string" ? b.contentType : undefined,
      options:
        typeof b.options === "object" && b.options !== null
          ? (b.options as Record<string, unknown>)
          : undefined
    }
  };
}

export function validateRouteAndInput(request: ConvertRequest): ValidationResult {
  if (!isRouteImplemented(request.route)) {
    return {
      ok: false,
      code: "UNKNOWN_ROUTE",
      message: `Route '${request.route}' is not implemented.`
    };
  }
  const def = getRouteDefinition(request.route);
  if (!def) {
    return {
      ok: false,
      code: "UNKNOWN_ROUTE",
      message: `Route '${request.route}' is not implemented.`
    };
  }

  const ext = extensionOf(request.filename);
  if (ext && !def.acceptedExtensions.includes(ext)) {
    return {
      ok: false,
      code: "INVALID_EXTENSION",
      message: `Route '${request.route}' does not accept '${ext}' files.`,
      details: `Accepted extensions: ${def.acceptedExtensions.join(", ")}`
    };
  }

  const bytes = Buffer.byteLength(request.text, "utf8");
  if (bytes === 0) {
    return { ok: false, code: "EMPTY_INPUT", message: "Input text is empty." };
  }
  const max = getMaxInputBytes();
  if (bytes > max) {
    return {
      ok: false,
      code: "INPUT_TOO_LARGE",
      message: `Input exceeds the ${max} byte limit.`,
      details: `Received ${bytes} bytes.`
    };
  }

  return def.validate(request.text);
}
