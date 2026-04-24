import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/utils/blob-storage", () => ({
  uploadBlob: vi.fn().mockResolvedValue(undefined),
  resetBlobStorageClientForTests: vi.fn()
}));

import { convert } from "../../src/functions/convert";
import { uploadBlob } from "../../src/utils/blob-storage";
import { createMockContext, createMockRequest } from "./test-helpers";

const mockUpload = uploadBlob as unknown as ReturnType<typeof vi.fn>;

interface SuccessBody {
  ok: true;
  route: string;
  original: { filename: string; blobName: string };
  converted: { filename: string; contentType: string; text: string; blobName: string };
  metrics: { durationMs: number; inputBytes: number; outputBytes: number };
}

interface ErrorBody {
  ok: false;
  code: string;
  message: string;
  details?: string;
}

describe("convert HTTP handler (integration)", () => {
  beforeEach(() => {
    mockUpload.mockClear();
    mockUpload.mockResolvedValue(undefined);
  });

  afterEach(() => {
    mockUpload.mockReset();
  });

  describe("happy path", () => {
    it("converts json_to_text, uploads both blobs, and returns the agreed response shape", async () => {
      const req = createMockRequest({
        body: {
          route: "json_to_text",
          filename: "student.json",
          text: '{"name":"Student One","level":5}'
        }
      });
      const res = await convert(req, createMockContext());

      expect(res.status).toBe(200);
      const body = res.jsonBody as SuccessBody;
      expect(body.ok).toBe(true);
      expect(body.route).toBe("json_to_text");
      expect(body.converted.text).toBe("Name: Student One\nLevel: 5");
      expect(body.converted.filename).toBe("student.txt");
      expect(body.converted.contentType).toBe("text/plain; charset=utf-8");

      expect(body.original.blobName).toMatch(
        /^originals\/json_to_text\/\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}_student\.json$/
      );
      expect(body.converted.blobName).toMatch(
        /^converted\/json_to_text\/\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}_student\.txt$/
      );

      expect(body.metrics.inputBytes).toBeGreaterThan(0);
      expect(body.metrics.outputBytes).toBeGreaterThan(0);
      expect(body.metrics.durationMs).toBeGreaterThanOrEqual(0);

      expect(mockUpload).toHaveBeenCalledTimes(2);
    });

    it("passes original input, converted output, and route metadata to uploadBlob", async () => {
      const req = createMockRequest({
        body: {
          route: "json_to_text",
          filename: "info.json",
          text: '{"a":1}'
        }
      });
      await convert(req, createMockContext());

      const originalCall = mockUpload.mock.calls[0];
      const convertedCall = mockUpload.mock.calls[1];

      expect(originalCall[0]).toContain("originals/json_to_text/");
      expect(originalCall[1]).toBe('{"a":1}');
      expect(originalCall[3]).toMatchObject({ route: "json_to_text", kind: "original" });

      expect(convertedCall[0]).toContain("converted/json_to_text/");
      expect(convertedCall[1]).toBe("A: 1");
      expect(convertedCall[2]).toBe("text/plain; charset=utf-8");
      expect(convertedCall[3]).toMatchObject({ route: "json_to_text", kind: "converted" });
    });

    it("sanitises unsafe characters in the input filename", async () => {
      const req = createMockRequest({
        body: {
          route: "json_to_text",
          filename: "my notes!.json",
          text: '{"a":1}'
        }
      });
      const res = await convert(req, createMockContext());
      const body = res.jsonBody as SuccessBody;
      expect(body.original.filename).toBe("my_notes_.json");
      expect(body.converted.filename).toBe("my_notes_.txt");
    });

    it("shares a single timestamp between the original and converted blob names", async () => {
      const req = createMockRequest({
        body: {
          route: "json_to_text",
          filename: "x.json",
          text: '{"a":1}'
        }
      });
      const res = await convert(req, createMockContext());
      const body = res.jsonBody as SuccessBody;
      const origStamp = body.original.blobName.match(
        /\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}/
      )?.[0];
      const convStamp = body.converted.blobName.match(
        /\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}/
      )?.[0];
      expect(origStamp).toBeDefined();
      expect(origStamp).toBe(convStamp);
    });
  });

  describe("request-level validation", () => {
    it("returns 400 INVALID_INPUT when the body is not JSON", async () => {
      const req = createMockRequest({ jsonError: true });
      const res = await convert(req, createMockContext());
      expect(res.status).toBe(400);
      const body = res.jsonBody as ErrorBody;
      expect(body.ok).toBe(false);
      expect(body.code).toBe("INVALID_INPUT");
      expect(mockUpload).not.toHaveBeenCalled();
    });

    it("returns 400 INVALID_INPUT when 'route' is missing", async () => {
      const req = createMockRequest({
        body: { filename: "x.json", text: '{"a":1}' }
      });
      const res = await convert(req, createMockContext());
      expect(res.status).toBe(400);
      expect((res.jsonBody as ErrorBody).code).toBe("INVALID_INPUT");
    });

    it("returns 404 UNKNOWN_ROUTE for a route string that is not registered", async () => {
      const req = createMockRequest({
        body: {
          route: "nonexistent_route",
          filename: "x.json",
          text: '{"a":1}'
        }
      });
      const res = await convert(req, createMockContext());
      expect(res.status).toBe(404);
      expect((res.jsonBody as ErrorBody).code).toBe("UNKNOWN_ROUTE");
    });

    it("returns 400 INVALID_EXTENSION when the filename extension is not accepted", async () => {
      const req = createMockRequest({
        body: {
          route: "json_to_text",
          filename: "notes.csv",
          text: '{"a":1}'
        }
      });
      const res = await convert(req, createMockContext());
      expect(res.status).toBe(400);
      expect((res.jsonBody as ErrorBody).code).toBe("INVALID_EXTENSION");
    });

    it("returns 400 EMPTY_INPUT for empty text", async () => {
      const req = createMockRequest({
        body: {
          route: "json_to_text",
          filename: "x.json",
          text: ""
        }
      });
      const res = await convert(req, createMockContext());
      expect(res.status).toBe(400);
      expect((res.jsonBody as ErrorBody).code).toBe("EMPTY_INPUT");
    });

    describe("MAX_INPUT_BYTES override", () => {
      const original = process.env.MAX_INPUT_BYTES;

      beforeEach(() => {
        process.env.MAX_INPUT_BYTES = "10";
      });
      afterEach(() => {
        if (original === undefined) delete process.env.MAX_INPUT_BYTES;
        else process.env.MAX_INPUT_BYTES = original;
      });

      it("returns 413 INPUT_TOO_LARGE when input exceeds the configured limit", async () => {
        const req = createMockRequest({
          body: {
            route: "json_to_text",
            filename: "x.json",
            text: '{"aaaaaaaa":1}'
          }
        });
        const res = await convert(req, createMockContext());
        expect(res.status).toBe(413);
        expect((res.jsonBody as ErrorBody).code).toBe("INPUT_TOO_LARGE");
      });
    });
  });

  describe("route-level validation", () => {
    it("returns 400 INVALID_JSON when json_to_text receives invalid JSON", async () => {
      const req = createMockRequest({
        body: {
          route: "json_to_text",
          filename: "x.json",
          text: "not json"
        }
      });
      const res = await convert(req, createMockContext());
      expect(res.status).toBe(400);
      expect((res.jsonBody as ErrorBody).code).toBe("INVALID_JSON");
    });

    it("returns 400 INVALID_CSV when csv_to_json receives extra rows", async () => {
      const req = createMockRequest({
        body: {
          route: "csv_to_json",
          filename: "data.csv",
          text: "a,b\n1,2\n3,4"
        }
      });
      const res = await convert(req, createMockContext());
      expect(res.status).toBe(400);
      expect((res.jsonBody as ErrorBody).code).toBe("INVALID_CSV");
    });
  });

  describe("storage failure", () => {
    it("returns 500 STORAGE_ERROR when the original upload rejects", async () => {
      mockUpload.mockRejectedValueOnce(new Error("blob service unavailable"));
      const req = createMockRequest({
        body: {
          route: "json_to_text",
          filename: "x.json",
          text: '{"a":1}'
        }
      });
      const res = await convert(req, createMockContext());
      expect(res.status).toBe(500);
      const body = res.jsonBody as ErrorBody;
      expect(body.code).toBe("STORAGE_ERROR");
      expect(body.details).toContain("blob service unavailable");
    });

    it("returns 500 STORAGE_ERROR when the converted upload rejects", async () => {
      mockUpload
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error("second upload failed"));
      const req = createMockRequest({
        body: {
          route: "json_to_text",
          filename: "x.json",
          text: '{"a":1}'
        }
      });
      const res = await convert(req, createMockContext());
      expect(res.status).toBe(500);
      expect((res.jsonBody as ErrorBody).code).toBe("STORAGE_ERROR");
    });
  });
});
