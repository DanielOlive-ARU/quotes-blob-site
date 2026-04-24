import { uppercase } from "./uppercase";
import { sentencecase } from "./sentencecase";

export type FormatterAction = "uppercase" | "sentencecase";
export type FormatterFn = (input: string) => string;

export const FORMATTERS: Record<FormatterAction, FormatterFn> = {
  uppercase,
  sentencecase
};
