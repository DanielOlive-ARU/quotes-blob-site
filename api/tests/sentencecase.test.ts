import { describe, it, expect } from "vitest";
import { sentencecase } from "../src/formatters/sentencecase";

describe("sentencecase formatter", () => {
  it("capitalises the start of each sentence", () => {
    const input = "hello world. this is a test! WHAT IS GOING ON?";
    const result = sentencecase(input);

    expect(result).toBe("Hello world. This is a test! What is going on?");
  });

  it("treats a new line as a fresh sentence start", () => {
    const input = "hello world.\nthis is line two.";
    const result = sentencecase(input);

    expect(result).toBe("Hello world.\nThis is line two.");
  });
});
