import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { BlobServiceClient } from "@azure/storage-blob";
import { FORMATTERS, FormatterAction } from "../formatters";

type Body = {
  filename?: string;
  text?: string;
};

function detectAction(filename: string): FormatterAction | null {
  const lower = filename.toLowerCase();
  if (lower.includes("_uppercase.txt")) return "uppercase";
  if (lower.includes("_sentencecase.txt")) return "sentencecase";
  return null;
}

function buildOutputFilename(filename: string): string {
  if (!filename.toLowerCase().endsWith(".txt")) {
    return `${filename}_formatted.txt`;
  }
  return filename.replace(/\.txt$/i, "_formatted.txt");
}

function sanitiseFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_");
}

async function uploadTextBlob(
  containerClient: ReturnType<BlobServiceClient["getContainerClient"]>,
  blobName: string,
  text: string
): Promise<void> {
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  await blockBlobClient.upload(
    Buffer.from(text, "utf8"),
    Buffer.byteLength(text, "utf8"),
    {
      blobHTTPHeaders: {
        blobContentType: "text/plain; charset=utf-8"
      }
    }
  );
}

export async function format(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const body = (await request.json()) as Body;

    const filename = body?.filename?.trim() ?? "";
    const text = body?.text ?? "";

    if (!filename || typeof filename !== "string") {
      return {
        status: 400,
        jsonBody: { error: "Missing 'filename' in JSON body." }
      };
    }

    if (!text || typeof text !== "string") {
      return {
        status: 400,
        jsonBody: { error: "Missing 'text' in JSON body." }
      };
    }

    if (text.length > 200_000) {
      return {
        status: 413,
        jsonBody: { error: "Text too large for this demo." }
      };
    }

    const action = detectAction(filename);

    if (!action) {
      return {
        status: 400,
        jsonBody: {
          error: "Could not determine formatter from filename. Use names like notes_uppercase.txt or notes_sentencecase.txt."
        }
      };
    }

    const formatter = FORMATTERS[action];

    if (!formatter) {
      return {
        status: 400,
        jsonBody: { error: `No formatter registered for action '${action}'.` }
      };
    }

    const result = formatter(text);
    const outputFilename = buildOutputFilename(filename);

    const storageConnection = process.env.FILES_STORAGE;
    const containerName = process.env.FILES_CONTAINER || "files";

    if (!storageConnection) {
      return {
        status: 500,
        jsonBody: { error: "FILES_STORAGE is not configured in Function App settings." }
      };
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(storageConnection);
    const containerClient = blobServiceClient.getContainerClient(containerName);

    await containerClient.createIfNotExists();

    const safeInputName = sanitiseFilename(filename);
    const safeOutputName = sanitiseFilename(outputFilename);

    const originalBlobName = `originals/${safeInputName}`;
    const formattedBlobName = `converted/${safeOutputName}`;

    await uploadTextBlob(containerClient, originalBlobName, text);
    await uploadTextBlob(containerClient, formattedBlobName, result);

    return {
      status: 200,
      jsonBody: {
        action,
        outputFilename,
        result,
        originalBlobName,
        formattedBlobName
      }
    };
  } catch (err) {
    context.error("Format function failed", err);
    return {
      status: 400,
      jsonBody: { error: "Invalid request body or storage operation failed." }
    };
  }
}

app.http("format", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "format",
  handler: format
});
