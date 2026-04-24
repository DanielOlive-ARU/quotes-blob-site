import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext
} from "@azure/functions";
import { getRouteDefinition } from "../routing/route-metadata";
import {
  validateRequestShape,
  validateRouteAndInput
} from "../routing/validate-request";
import { uploadBlob } from "../utils/blob-storage";
import {
  errorResponse,
  httpStatusForError,
  successResponse
} from "../utils/response";
import { replaceExtension, sanitiseFilename } from "../utils/sanitise";
import { buildBlobName, isoTimestamp } from "../utils/timestamp";

type ConvertOutcome =
  | "ok"
  | "bad_request"
  | "rejected"
  | "failed"
  | "storage_error";

interface ConvertLogFields {
  outcome: ConvertOutcome;
  route?: string;
  code?: string;
  inputBytes?: number;
  outputBytes?: number;
  durationMs?: number;
  message?: string;
  details?: string;
}

function logConvertEvent(
  context: InvocationContext,
  level: "info" | "error",
  fields: ConvertLogFields
): void {
  const payload = {
    event: "convert",
    invocationId: context.invocationId,
    ...fields
  };
  if (level === "error") {
    context.error(payload);
  } else {
    context.log(payload);
  }
}

export async function convert(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const startedAt = Date.now();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    const err = errorResponse("INVALID_INPUT", "Request body is not valid JSON.");
    logConvertEvent(context, "info", {
      outcome: "bad_request",
      code: err.code,
      message: err.message,
      durationMs: Date.now() - startedAt
    });
    return { status: httpStatusForError(err.code), jsonBody: err };
  }

  const shape = validateRequestShape(body);
  if (!shape.ok || !shape.parsed) {
    const err = errorResponse(
      shape.code ?? "INVALID_INPUT",
      shape.message ?? "Invalid request.",
      shape.details
    );
    logConvertEvent(context, "info", {
      outcome: "bad_request",
      code: err.code,
      message: err.message,
      durationMs: Date.now() - startedAt
    });
    return { status: httpStatusForError(err.code), jsonBody: err };
  }
  const req = shape.parsed;

  const routeValidation = validateRouteAndInput(req);
  if (!routeValidation.ok) {
    const err = errorResponse(
      routeValidation.code ?? "INVALID_INPUT",
      routeValidation.message ?? "Validation failed.",
      routeValidation.details
    );
    logConvertEvent(context, "info", {
      outcome: "rejected",
      route: req.route,
      code: err.code,
      message: err.message,
      durationMs: Date.now() - startedAt
    });
    return { status: httpStatusForError(err.code), jsonBody: err };
  }

  const def = getRouteDefinition(req.route);
  if (!def) {
    const err = errorResponse(
      "UNKNOWN_ROUTE",
      `Route '${req.route}' is not implemented.`
    );
    logConvertEvent(context, "info", {
      outcome: "rejected",
      route: req.route,
      code: err.code,
      message: err.message,
      durationMs: Date.now() - startedAt
    });
    return { status: httpStatusForError(err.code), jsonBody: err };
  }

  let converted: string;
  try {
    converted = def.convert(req.text, req.options);
  } catch (e) {
    const err = errorResponse(
      "CONVERSION_FAILED",
      `Conversion failed for route '${req.route}'.`,
      e instanceof Error ? e.message : undefined
    );
    logConvertEvent(context, "error", {
      outcome: "failed",
      route: req.route,
      code: err.code,
      message: err.message,
      details: err.details,
      durationMs: Date.now() - startedAt
    });
    return { status: httpStatusForError(err.code), jsonBody: err };
  }

  const timestamp = isoTimestamp();
  const safeInputName = sanitiseFilename(req.filename);
  const outputFilename = replaceExtension(safeInputName, def.outputExtension);
  const originalBlobName = buildBlobName(
    "originals",
    req.route,
    safeInputName,
    timestamp
  );
  const convertedBlobName = buildBlobName(
    "converted",
    req.route,
    outputFilename,
    timestamp
  );

  try {
    await uploadBlob(
      originalBlobName,
      req.text,
      req.contentType ?? "application/octet-stream",
      { route: req.route, kind: "original" }
    );
    await uploadBlob(convertedBlobName, converted, def.outputMimeType, {
      route: req.route,
      kind: "converted"
    });
  } catch (e) {
    const err = errorResponse(
      "STORAGE_ERROR",
      "Failed to persist original or converted blob.",
      e instanceof Error ? e.message : undefined
    );
    logConvertEvent(context, "error", {
      outcome: "storage_error",
      route: req.route,
      code: err.code,
      message: err.message,
      details: err.details,
      durationMs: Date.now() - startedAt
    });
    return { status: httpStatusForError(err.code), jsonBody: err };
  }

  const inputBytes = Buffer.byteLength(req.text, "utf8");
  const outputBytes = Buffer.byteLength(converted, "utf8");
  const durationMs = Date.now() - startedAt;

  const payload = successResponse({
    route: req.route,
    original: { filename: safeInputName, blobName: originalBlobName },
    converted: {
      filename: outputFilename,
      contentType: def.outputMimeType,
      text: converted,
      blobName: convertedBlobName
    },
    metrics: { durationMs, inputBytes, outputBytes }
  });

  logConvertEvent(context, "info", {
    outcome: "ok",
    route: req.route,
    inputBytes,
    outputBytes,
    durationMs
  });

  return { status: 200, jsonBody: payload };
}

app.http("convert", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "convert",
  handler: convert
});
