import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { 
  BlobServiceClient, 
  BlobSASPermissions, 
  generateBlobSASQueryParameters,
  StorageSharedKeyCredential 
} from "@azure/storage-blob";
import { FORMATTERS, FormatterAction } from "../formatters";

type Body = {
  filename?: string;
  text?: string;
};

function generateTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");
  return `${year}${month}${day}_${hour}${minute}`;
}

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

    // Extension 1: Add timestamp to blob names
    const timestamp = generateTimestamp();
    const safeInputName = sanitiseFilename(filename);
    const safeOutputName = sanitiseFilename(outputFilename);

    const originalBlobName = `originals/${timestamp}_${safeInputName}`;
    const formattedBlobName = `converted/${timestamp}_${safeOutputName}`;

    await uploadTextBlob(containerClient, originalBlobName, text);
    await uploadTextBlob(containerClient, formattedBlobName, result);

    // Extension 2: Generate SAS URL for direct blob download
    let formattedBlobUrl = "";
    
    try {
      // Parse connection string to extract account name and key for SAS generation
      const accountMatch = storageConnection.match(/AccountName=([^;]+)/);
      const keyMatch = storageConnection.match(/AccountKey=([^;]+)/);
      
      if (accountMatch && keyMatch) {
        const accountName = accountMatch[1];
        const accountKey = keyMatch[1];
        const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);

        // Generate SAS token valid for 1 hour
        const sasToken = generateBlobSASQueryParameters(
          {
            containerName,
            blobName: formattedBlobName,
            permissions: BlobSASPermissions.parse("r"), // read-only
            startsOn: new Date(),
            expiresOn: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
          },
          sharedKeyCredential
        ).toString();

        formattedBlobUrl = `${containerClient.url}/${formattedBlobName}?${sasToken}`;
      }
    } catch (sasError) {
      context.warn("Failed to generate SAS URL", sasError);
      // Continue without SAS URL if generation fails
    }

    return {
      status: 200,
      jsonBody: {
        action,
        outputFilename,
        result,
        originalBlobName,
        formattedBlobName,
        formattedBlobUrl
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
