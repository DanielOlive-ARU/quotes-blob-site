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

  // Edge cases — input boundaries
  it("returns an empty string unchanged", () => {
    expect(sentencecase("")).toBe("");
  });

  it("capitalises a single character", () => {
    expect(sentencecase("h")).toBe("H");
  });

  it("returns whitespace-only input unchanged", () => {
    expect(sentencecase("   ")).toBe("   ");
  });

  // Already-correct input
  it("is idempotent — already sentence case input is unchanged", () => {
    const input = "Hello world. This is fine.";
    expect(sentencecase(input)).toBe("Hello world. This is fine.");
  });

  // Punctuation behaviour
  it("capitalises the letter after multiple consecutive punctuation marks", () => {
    const input = "wait... really?";
    const result = sentencecase(input);

    expect(result).toBe("Wait... Really?");
  });

  it("only capitalises the first word when there is no punctuation", () => {
    const input = "hello world this is one long sentence";
    const result = sentencecase(input);

    expect(result).toBe("Hello world this is one long sentence");
  });

  // Numbers and special characters
  it("capitalises the first letter after punctuation even when a number comes first", () => {
    const input = "hello. 2 cats sat down. they were happy.";
    const result = sentencecase(input);

    // capNext stays true through the digit '2' and space, so 'cats' becomes 'Cats'
    expect(result).toBe("Hello. 2 Cats sat down. They were happy.");
  });
});
