import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  validateRequestShape,
  validateRouteAndInput
} from "../../../src/routing/validate-request";

describe("validateRequestShape", () => {
  it("accepts a well-formed body", () => {
    const result = validateRequestShape({
      route: "json_to_text",
      filename: "test.json",
      text: '{"a":1}'
    });
    expect(result.ok).toBe(true);
    expect(result.parsed?.route).toBe("json_to_text");
  });

  it("rejects a non-object body", () => {
    const result = validateRequestShape("not an object");
    expect(result.ok).toBe(false);
    expect(result.code).toBe("INVALID_INPUT");
  });

  it("rejects a missing route", () => {
    const result = validateRequestShape({ filename: "a.json", text: "{}" });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("INVALID_INPUT");
  });

  it("rejects a non-string text field", () => {
    const result = validateRequestShape({
      route: "json_to_text",
      filename: "a.json",
      text: 42
    });
    expect(result.ok).toBe(false);
  });
});

describe("validateRouteAndInput", () => {
  it("accepts a valid json_to_text request", () => {
    const result = validateRouteAndInput({
      route: "json_to_text",
      filename: "student.json",
      text: '{"a":1}'
    });
    expect(result.ok).toBe(true);
  });

  it("rejects an unknown / not-yet-implemented route", () => {
    const result = validateRouteAndInput({
      route: "csv_to_json",
      filename: "x.csv",
      text: "a,b\n1,2"
    });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("UNKNOWN_ROUTE");
  });

  it("rejects a disallowed extension for the selected route", () => {
    const result = validateRouteAndInput({
      route: "json_to_text",
      filename: "x.csv",
      text: '{"a":1}'
    });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("INVALID_EXTENSION");
  });

  it("rejects empty input", () => {
    const result = validateRouteAndInput({
      route: "json_to_text",
      filename: "x.json",
      text: ""
    });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("EMPTY_INPUT");
  });

  describe("MAX_INPUT_BYTES", () => {
    const original = process.env.MAX_INPUT_BYTES;

    beforeEach(() => {
      process.env.MAX_INPUT_BYTES = "10";
    });

    afterEach(() => {
      if (original === undefined) delete process.env.MAX_INPUT_BYTES;
      else process.env.MAX_INPUT_BYTES = original;
    });

    it("rejects input exceeding the configured limit", () => {
      const result = validateRouteAndInput({
        route: "json_to_text",
        filename: "x.json",
        text: '{"aaaaaaa":1}'
      });
      expect(result.ok).toBe(false);
      expect(result.code).toBe("INPUT_TOO_LARGE");
    });
  });
});
