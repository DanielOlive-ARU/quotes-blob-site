import type {
  ConvertError,
  ConvertSuccess,
  ErrorCode
} from "../routing/route-types";

export function successResponse(
  payload: Omit<ConvertSuccess, "ok">
): ConvertSuccess {
  return { ok: true, ...payload };
}

export function errorResponse(
  code: ErrorCode,
  message: string,
  details?: string
): ConvertError {
  const body: ConvertError = { ok: false, code, message };
  if (details) body.details = details;
  return body;
}

export function httpStatusForError(code: ErrorCode): number {
  switch (code) {
    case "UNKNOWN_ROUTE":
    case "NOT_IMPLEMENTED":
      return 404;
    case "INVALID_INPUT":
    case "INVALID_JSON":
    case "INVALID_XML":
    case "INVALID_CSV":
    case "INVALID_FORM":
    case "INVALID_EXTENSION":
    case "EMPTY_INPUT":
      return 400;
    case "INPUT_TOO_LARGE":
      return 413;
    case "CONVERSION_FAILED":
    case "STORAGE_ERROR":
      return 500;
    default:
      return 400;
  }
}
