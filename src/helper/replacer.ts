import safe from "safe-regex";
import { ParsedWord } from "./textParser.js";

export function replaceText(rules: ParsedWord[], text: string): string {
  const regexRules = rules.filter((rule) => rule.base.isRegex);
  const stringRules = rules.filter((rule) => !rule.base.isRegex);
  for (const rule of regexRules) {
    try {
      const regex = new RegExp(String(rule.base.baseWord), "g");
      if (!safe(regex)) {
        console.error("Unsafe regex:", rule.base.baseWord);
        // If regex is unsafe, skip this rule
        continue;
      }
      text = text.replaceAll(regex, rule.target?.targetWord ?? "***");
    } catch (error) {
      console.error("Error creating regex:", rule.base.baseWord, error);
      // If regex is invalid, skip this rule
      continue;
    }
  }
  for (const rule of stringRules) {
    text = text.replaceAll(
      rule.base.baseWord,
      rule.target?.targetWord ?? "***"
    );
  }
  return text;
}
