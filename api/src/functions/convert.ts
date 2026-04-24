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
    return { status: httpStatusForError(err.code), jsonBody: err };
  }

  const shape = validateRequestShape(body);
  if (!shape.ok || !shape.parsed) {
    const err = errorResponse(
      shape.code ?? "INVALID_INPUT",
      shape.message ?? "Invalid request.",
      shape.details
    );
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
    context.log(
      `convert route=${req.route} rejected code=${err.code} message=${err.message}`
    );
    return { status: httpStatusForError(err.code), jsonBody: err };
  }

  const def = getRouteDefinition(req.route);
  if (!def) {
    const err = errorResponse(
      "UNKNOWN_ROUTE",
      `Route '${req.route}' is not implemented.`
    );
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
    context.error(
      `convert route=${req.route} failed: ${err.details ?? err.message}`
    );
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
    context.error(
      `convert route=${req.route} blob upload failed: ${
        e instanceof Error ? e.message : String(e)
      }`
    );
    const err = errorResponse(
      "STORAGE_ERROR",
      "Failed to persist original or converted blob.",
      e instanceof Error ? e.message : undefined
    );
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

  context.log(
    `convert route=${req.route} input=${inputBytes}B output=${outputBytes}B duration=${durationMs}ms ok=true`
  );

  return { status: 200, jsonBody: payload };
}

app.http("convert", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "convert",
  handler: convert
});
