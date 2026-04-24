export type RouteKey =
  | "json_to_html"
  | "json_to_text"
  | "list_to_json_array"
  | "csv_to_json"
  | "json_array_to_csv"
  | "form_to_json"
  | "json_to_keyvalue"
  | "xml_to_text"
  | "markdown_to_html"
  | "json_to_xml";

export interface ConvertRequest {
  route: RouteKey;
  filename: string;
  text: string;
  contentType?: string;
  options?: Record<string, unknown>;
}

export interface ConvertSuccess {
  ok: true;
  route: RouteKey;
  original: {
    filename: string;
    blobName: string;
  };
  converted: {
    filename: string;
    contentType: string;
    text: string;
    blobName: string;
  };
  metrics: {
    durationMs: number;
    inputBytes: number;
    outputBytes: number;
  };
}

export type ErrorCode =
  | "INVALID_INPUT"
  | "UNKNOWN_ROUTE"
  | "INVALID_JSON"
  | "INVALID_XML"
  | "INVALID_CSV"
  | "INVALID_FORM"
  | "INVALID_EXTENSION"
  | "EMPTY_INPUT"
  | "INPUT_TOO_LARGE"
  | "CONVERSION_FAILED"
  | "NOT_IMPLEMENTED"
  | "STORAGE_ERROR";

export interface ConvertError {
  ok: false;
  code: ErrorCode;
  message: string;
  details?: string;
}

export type ConvertResponse = ConvertSuccess | ConvertError;

export interface ValidationResult {
  ok: boolean;
  code?: ErrorCode;
  message?: string;
  details?: string;
}

export interface RouteDefinition {
  key: RouteKey;
  label: string;
  description: string;
  acceptedExtensions: readonly string[];
  acceptedMimeTypes: readonly string[];
  outputExtension: string;
  outputMimeType: string;
  exampleInput: string;
  exampleOutput: string;
  validate: (input: string) => ValidationResult;
  convert: (input: string, options?: Record<string, unknown>) => string;
}
