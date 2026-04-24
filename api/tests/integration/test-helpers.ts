import type { HttpRequest, InvocationContext } from "@azure/functions";
import { vi } from "vitest";

export interface MockRequestOptions {
  body?: unknown;
  jsonError?: boolean;
}

export function createMockRequest(options: MockRequestOptions = {}): HttpRequest {
  const { body = {}, jsonError = false } = options;
  const jsonFn = jsonError
    ? () => Promise.reject(new SyntaxError("Bad JSON"))
    : () => Promise.resolve(body);

  return {
    method: "POST",
    url: "http://localhost/api/convert",
    headers: new Headers(),
    query: new URLSearchParams(),
    params: {},
    user: null,
    body: null,
    json: jsonFn,
    text: () =>
      Promise.resolve(
        typeof body === "string" ? body : JSON.stringify(body)
      ),
    formData: () => Promise.resolve(new FormData()),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    blob: () => Promise.resolve(new Blob()),
    clone: () => createMockRequest(options)
  } as unknown as HttpRequest;
}

export function createMockContext(): InvocationContext {
  return {
    invocationId: "test-invocation",
    functionName: "convert",
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    trace: vi.fn(),
    extraInputs: { get: () => null, set: () => {} },
    extraOutputs: { get: () => null, set: () => {} },
    options: { trigger: { name: "httpTrigger", type: "httpTrigger" } }
  } as unknown as InvocationContext;
}
