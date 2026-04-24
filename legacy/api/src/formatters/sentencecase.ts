export function sentencecase(input: string): string {
  const chars = input.toLowerCase().split("");

  let capNext = true;

  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];

    if (capNext && c >= "a" && c <= "z") {
      chars[i] = c.toUpperCase();
      capNext = false;
      continue;
    }

    if (c === "." || c === "!" || c === "?") {
      capNext = true;
      continue;
    }

    if (c === "\n") {
      capNext = true;
    }
  }

  return chars.join("");
}
