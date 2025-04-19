import {
  sqliteTable,
  text,
  primaryKey,
  int,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

// Guild table
export const guildTable = sqliteTable("guild_table", {
  id: text().primaryKey(),
});

// BaseWord table
export const baseWordTable = sqliteTable(
  "base_word_table",
  {
    id: int("id").primaryKey({
      autoIncrement: true,
    }),
    guildId: text("guild_id")
      .notNull()
      .references(() => guildTable.id),
    baseWord: text("base_word").notNull(),
    planeBaseWord: text("plane_base_word").notNull(),
    isRegex: int("is_regex").notNull().default(0),
  },
  (t) => [
    uniqueIndex("idx_base_word").on(t.guildId, t.baseWord),
    uniqueIndex("idx_plane_base_word").on(t.guildId, t.planeBaseWord),
  ]
);

export const targetWordTable = sqliteTable("target_word_table", {
  guildId: text("guild_id")
    .notNull()
    .references(() => guildTable.id),
  baseWordId: int("base_word_id")
    .notNull()
    .primaryKey()
    .references(() => baseWordTable.id),
  targetWord: text("target_word").notNull(),
  planeTargetWord: text("plane_target_word").notNull(),
});

export type NewBaseWord = typeof baseWordTable.$inferInsert;
export type NewTargetWord = typeof targetWordTable.$inferInsert;
