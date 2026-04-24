import { describe, expect, it } from "vitest";
import { replaceExtension, sanitiseFilename } from "../../../src/utils/sanitise";

describe("sanitiseFilename", () => {
  it("keeps allowed characters", () => {
    expect(sanitiseFilename("student-file.json")).toBe("student-file.json");
  });

  it("replaces spaces and unsafe characters with underscores", () => {
    expect(sanitiseFilename("my file!.json")).toBe("my_file_.json");
  });

  it("collapses repeated underscores", () => {
    expect(sanitiseFilename("a   b")).toBe("a_b");
  });

  it("truncates very long names", () => {
    const long = "a".repeat(200) + ".json";
    expect(sanitiseFilename(long).length).toBe(120);
  });
});

describe("replaceExtension", () => {
  it("replaces .json with .txt", () => {
    expect(replaceExtension("student.json", ".txt")).toBe("student.txt");
  });

  it("accepts an extension without a leading dot", () => {
    expect(replaceExtension("student.json", "txt")).toBe("student.txt");
  });

  it("appends the extension when the original has none", () => {
    expect(replaceExtension("student", ".txt")).toBe("student.txt");
  });
});
