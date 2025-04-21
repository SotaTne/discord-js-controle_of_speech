import {
  baseWordTable,
  guildTable,
  NewBaseWord,
  NewTargetWord,
  targetWordTable,
} from "./../../db/schema.js";
import {
  eq,
  getTableColumns,
  sql,
  SQL,
  AnyColumn,
  asc,
  desc,
} from "drizzle-orm";
import { db } from "../../db/db.js";
import { SQLiteTable, unionAll } from "drizzle-orm/sqlite-core";
import { ParsedWord } from "./textParser.js";

const buildConflictUpdateColumns = <
  T extends SQLiteTable,
  Q extends keyof T["_"]["columns"]
>(
  table: T,
  columns: Q[]
) => {
  const cls = getTableColumns(table);
  return columns.reduce((acc, column) => {
    const colName = cls[column].name;
    acc[column] = sql.raw(`excluded.${colName}`);
    return acc;
  }, {} as Record<Q, SQL>);
};

export async function setWord(
  guildId: string,
  base: {
    baseWord: string;
    planeBaseWord: string;
    isRegex: boolean;
  },
  target?: {
    targetWord: string;
    planeTargetWord: string;
  }
): Promise<void> {
  await db.transaction(async (tx) => {
    await tx
      .insert(guildTable)
      .values({
        id: guildId,
      })
      .onConflictDoNothing();

    const added = await tx
      .insert(baseWordTable)
      .values({
        guildId: guildId,
        baseWord: base.baseWord,
        planeBaseWord: base.planeBaseWord,
        isRegex: base.isRegex ? 1 : 0,
      })
      .onConflictDoUpdate({
        target: [baseWordTable.guildId, baseWordTable.baseWord],
        set: {
          isRegex: base.isRegex ? 1 : 0,
        },
      })
      .returning({
        id: baseWordTable.id,
      });
    if (target && added.length === 1) {
      const baseWordId = added[0].id;
      await tx
        .insert(targetWordTable)
        .values({
          guildId: guildId,
          baseWordId: baseWordId,
          targetWord: target.targetWord,
          planeTargetWord: target.planeTargetWord,
        })
        .onConflictDoUpdate({
          target: [targetWordTable.baseWordId],
          set: {
            targetWord: target.targetWord,
            planeTargetWord: target.planeTargetWord,
          },
        });
    }
  });
}

export async function setWords(
  guildId: string,
  words: {
    base: {
      baseWord: string;
      planeBaseWord: string;
      isRegex: boolean;
    };
    target?: {
      targetWord: string;
      planeTargetWord: string;
    };
  }[]
): Promise<void> {
  const filteredWords: {
    base: {
      baseWord: string;
      planeBaseWord: string;
      isRegex: boolean;
    };
    target: {
      targetWord: string;
      planeTargetWord: string;
    };
  }[] = [];

  for (const word of words) {
    const target = word.target;
    if (target) {
      filteredWords.push({
        base: word.base,
        target: {
          targetWord: target.targetWord,
          planeTargetWord: target.planeTargetWord,
        },
      });
    }
  }
  await db.transaction(async (tx) => {
    await tx
      .insert(guildTable)
      .values({
        id: guildId,
      })
      .onConflictDoNothing();
    const baseWordData: NewBaseWord[] = words.map((word) => ({
      guildId: guildId,
      baseWord: word.base.baseWord,
      planeBaseWord: word.base.planeBaseWord,
      isRegex: word.base.isRegex ? 1 : 0,
    }));
    const added = await tx
      .insert(baseWordTable)
      .values(baseWordData)
      .onConflictDoUpdate({
        target: [baseWordTable.guildId, baseWordTable.baseWord],
        set: buildConflictUpdateColumns(baseWordTable, ["isRegex"]),
      })
      .returning();

    const targetWordData: NewTargetWord[] = filteredWords
      .filter((word) => {
        added.some((addedWord) => addedWord.baseWord === word.base.baseWord);
      })
      .map((word) => {
        return {
          guildId: guildId,
          baseWordId: added.find(
            (addedWord) => addedWord.baseWord === word.base.baseWord
          )!.id,
          targetWord: word.target?.targetWord,
          planeTargetWord: word.target?.planeTargetWord,
        };
      });

    await tx
      .insert(targetWordTable)
      .values(targetWordData)
      .onConflictDoUpdate({
        target: [targetWordTable.guildId, targetWordTable.baseWordId],
        set: buildConflictUpdateColumns(targetWordTable, [
          "targetWord",
          "planeTargetWord",
        ]),
      });
  });
}

export const match_regex = (regex: AnyColumn, word: string) => {
  return sql`${word} regexp ${regex}`;
};

export async function getWords(guildId: string): Promise<ParsedWord[]> {
  const words = await db.transaction(async (tx) => {
    await tx
      .insert(guildTable)
      .values({
        id: guildId,
      })
      .onConflictDoNothing();
    return await tx
      .select()
      .from(baseWordTable)
      .leftJoin(
        targetWordTable,
        eq(targetWordTable.baseWordId, baseWordTable.id)
      )
      .where(eq(baseWordTable.guildId, guildId))
      .orderBy(desc(baseWordTable.isRegex), asc(baseWordTable.baseWord));
  });
  return words.map((word) => ({
    base: {
      planeBaseWord: word.base_word_table.planeBaseWord,
      baseWord: word.base_word_table.baseWord,
      isRegex: Boolean(word.base_word_table.isRegex),
    },
    target: word.target_word_table
      ? {
          planeTargetWord: word.target_word_table.planeTargetWord,
          targetWord: word.target_word_table.targetWord,
        }
      : undefined,
  }));
}
