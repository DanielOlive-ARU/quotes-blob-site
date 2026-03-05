import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { FORMATTERS, FormatterAction } from "../formatters";

type Body = { filename?: string; text?: string };

function decideActionFromFilename(filename: string): FormatterAction | null {
  const lower = filename.toLowerCase();
  if (lower.includes("_uppercase.txt")) return "uppercase";
  if (lower.includes("_sentencecase.txt")) return "sentencecase";
  return null;
}

export async function format(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const body = (await request.json()) as Body;

    const filename = body?.filename ?? "";
    const text = body?.text ?? "";

    if (!filename || typeof filename !== "string") {
      return { status: 400, jsonBody: { error: "Missing 'filename' in JSON body." } };
    }

    if (!text || typeof text !== "string") {
      return { status: 400, jsonBody: { error: "Missing 'text' in JSON body." } };
    }

    if (text.length > 200_000) {
      return { status: 413, jsonBody: { error: "Text too large for this demo." } };
    }

    const action = decideActionFromFilename(filename);

    if (!action) {
      return {
        status: 400,
        jsonBody: {
          error:
            "Filename did not match a known formatter. Use *_uppercase.txt or *_sentencecase.txt (e.g., notes_uppercase.txt)."
        }
      };
    }

    const formatter = FORMATTERS[action];

    if (!formatter) {
      return { status: 400, jsonBody: { error: "No formatter registered for this action." } };
    }

    const result = formatter(text);
    const outputFilename = filename.replace(/\.txt$/i, `_formatted.txt`);

    return {
      status: 200,
      jsonBody: {
        action,
        outputFilename,
        result
      }
    };
  } catch {
    return { status: 400, jsonBody: { error: "Invalid JSON body." } };
  }
}

app.http("format", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "format",
  handler: format
});
