import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

export async function convert(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log("convert invoked (scaffolding stub)");

  return {
    status: 501,
    jsonBody: {
      ok: false,
      code: "NOT_IMPLEMENTED",
      message:
        "Conversion handler not yet implemented. This endpoint is a Phase 0 scaffolding stub; the real handler lands as part of Phase 2 (backend core)."
    }
  };
}

app.http("convert", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "convert",
  handler: convert
});
