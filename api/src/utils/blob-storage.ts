import { BlobServiceClient } from "@azure/storage-blob";

const DEFAULT_CONTAINER = "files";

let cachedClient: BlobServiceClient | undefined;

function getServiceClient(): BlobServiceClient {
  if (cachedClient) return cachedClient;
  const conn = process.env.FILES_STORAGE;
  if (!conn) {
    throw new Error("FILES_STORAGE environment variable is not set.");
  }
  cachedClient = BlobServiceClient.fromConnectionString(conn);
  return cachedClient;
}

function getContainerName(): string {
  return process.env.FILES_CONTAINER || DEFAULT_CONTAINER;
}

export async function uploadBlob(
  blobName: string,
  content: string,
  contentType: string,
  metadata?: Record<string, string>
): Promise<void> {
  const service = getServiceClient();
  const container = service.getContainerClient(getContainerName());
  await container.createIfNotExists();
  const blob = container.getBlockBlobClient(blobName);
  const buffer = Buffer.from(content, "utf8");
  await blob.upload(buffer, buffer.byteLength, {
    blobHTTPHeaders: { blobContentType: contentType },
    metadata
  });
}

export function resetBlobStorageClientForTests(): void {
  cachedClient = undefined;
}
