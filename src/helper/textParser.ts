import safe from "safe-regex";

export function getWordsByText(text: string): ParsedWord[] {
  const baseSet = new Set<string>();
  return text
    .split("\n")
    .map((line) => new LineParser(line).parse())
    .filter((word): word is ParsedWord => {
      if (!word || baseSet.has(word.base.planeBaseWord)) return false;
      baseSet.add(word.base.planeBaseWord);
      return true;
    });
}

export interface ParsedWord {
  base: {
    planeBaseWord: string;
    baseWord: string;
    isRegex: boolean;
  };
  target?: {
    planeTargetWord: string;
    targetWord: string;
  };
}

export class LineParser {
  private readonly line: string;
  private index = 0;

  constructor(text: string) {
    this.line = text.trim();
  }

  parse(): ParsedWord | undefined {
    let planeBaseWord = "";
    let baseWord = "";
    let planeTargetWord = "";
    let targetWord: string | undefined;
    let isRegex = false;

    try {
      while (this.index < this.line.length) {
        const char = this.line[this.index];
        if (/\s/.test(char) || char === ",") {
          this.index++;
          continue;
        }

        if (char === '"') {
          this.index++; // skip opening "
          let start = this.index;
          const result = this.parseString();
          if (!result) return undefined;
          if (!baseWord) {
            planeBaseWord = this.line.slice(start, this.index - 1);
            baseWord = result;
          } else {
            planeTargetWord = this.line.slice(start, this.index - 1);
            targetWord = result;
          }
        } else if (char === "/" && !baseWord) {
          this.index++; // skip opening /
          const result = this.parseRegex();
          if (!result) return undefined;
          planeBaseWord = result;
          baseWord = result;
          isRegex = true;
        } else {
          return undefined;
        }
      }

      if (!baseWord) return undefined;

      return {
        base: {
          planeBaseWord,
          baseWord,
          isRegex,
        },
        target: targetWord
          ? {
              planeTargetWord,
              targetWord,
            }
          : undefined,
      };
    } catch (e) {
      console.error("Error parsing line:", this.line, e);
      return undefined;
    }
  }

  static staticParseRegex(text: string) {
    const parser = new LineParser(text);
    return parser.parseRegex(true);
  }

  private parseRegex(fromStatic?: boolean): string | undefined {
    let start = this.index;
    while (this.index < this.line.length) {
      if (this.line[this.index] === "/") {
        const pattern = this.line.slice(start, this.index);
        if (this.isValidRegex(pattern)) {
          this.index++;
          return pattern;
        }
      }
      this.index++;
    }
    if (fromStatic) {
      const pattern = this.line.slice(start, this.index);
      if (this.isValidRegex(pattern)) {
        return pattern;
      }
    }
    return undefined;
  }

  static staticParseString(text: string) {
    const parser = new LineParser(text);
    return parser.parseString(true);
  }

  private parseString(fromStatic?: boolean): string | undefined {
    let result = "";

    while (this.index < this.line.length) {
      const char = this.line[this.index];

      if (char === "\\") {
        this.index++;
        const nextChar = this.line[this.index];
        const escMap: Record<string, string> = {
          '"': '"',
          "'": "'",
          "\\": "\\",
          n: "\n",
          r: "\r",
          t: "\t",
          b: "\b",
          f: "\f",
        };

        if (escMap[nextChar]) {
          result += escMap[nextChar];
          this.index++;
        } else if (nextChar === "x") {
          const hex = this.line.slice(this.index + 1, this.index + 3);
          if (/^[0-9a-fA-F]{2}$/.test(hex)) {
            result += String.fromCharCode(parseInt(hex, 16));
            this.index += 3;
          } else return undefined;
        } else if (nextChar === "u") {
          this.index++;
          if (this.line[this.index] === "{") {
            const end = this.line.indexOf("}", this.index);
            if (end === -1) return undefined;
            const hex = this.line.slice(this.index + 1, end);
            if (/^[0-9a-fA-F]{1,6}$/.test(hex)) {
              result += String.fromCharCode(parseInt(hex, 16));
              this.index = end + 1;
            } else return undefined;
          } else {
            const hex = this.line.slice(this.index, this.index + 4);
            if (/^[0-9a-fA-F]{4}$/.test(hex)) {
              result += String.fromCharCode(parseInt(hex, 16));
              this.index += 4;
            } else return undefined;
          }
        } else {
          result += nextChar;
          this.index++;
        }
      } else if (char === '"') {
        this.index++;
        return result;
      } else {
        result += char;
        this.index++;
      }
    }
    if (fromStatic) {
      return result;
    }
    return undefined;
  }

  private isValidRegex(pattern: string): boolean {
    try {
      const regex = new RegExp(pattern);
      return safe(regex);
    } catch (e) {
      return false;
    }
  }
}
