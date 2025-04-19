import { ParsedWord } from "./textParser.js";

export function getTextByWords(words: ParsedWord[]) {
  const baseSet = new Set<string>();
  return words
    .filter((word) => {
      if (baseSet.has(word.base.planeBaseWord)) {
        return false;
      }
      baseSet.add(word.base.planeBaseWord);
      return true;
    })
    .map((word) => {
      if (word.base.isRegex && word.target) {
        return `/${word.base.planeBaseWord}/ , "${word.target.planeTargetWord}"`;
      } else if (word.target) {
        return `"${word.base.planeBaseWord}" , "${word.target.planeTargetWord}"`;
      } else {
        return `"${word.base.planeBaseWord}"`;
      }
    })
    .join("\n");
}
