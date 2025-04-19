import { LineParser } from "./../helper/textParser.js";
import "dotenv/config";
import {
  CommandInteraction,
  CommandInteractionOptionResolver,
} from "discord.js";
import { getWords, setWord } from "../helper/database.js";

export async function addWordExec(interaction: CommandInteraction) {
  const guildId = interaction.guildId;
  if (!guildId) {
    console.error("Guild not found");
    interaction.reply({
      content: "Guild not found",
      ephemeral: true,
    });
    throw new Error("Guild not found");
  }
  const options = interaction.options as CommandInteractionOptionResolver;
  const targetText = options.getString("target_text", true);
  const replaceText = options.getString("replace_text") ?? undefined;
  const isRegex = options.getBoolean("is_regex") ?? false;
  console.log(
    "targetText:",
    targetText,
    "\nreplaceText:",
    replaceText,
    "\nisRegex:",
    isRegex
  );
  const result = LineParser.staticParseString(targetText);
  console.log("result:", result);
  const parsedTargetText = isRegex
    ? LineParser.staticParseRegex(targetText)
    : LineParser.staticParseString(targetText);
  const parsedReplaceText = replaceText
    ? LineParser.staticParseString(replaceText)
    : undefined;

  if (!parsedTargetText) {
    await interaction.reply({
      content: "target_textの形式が不正です",
      ephemeral: true,
    });
    return;
  }
  if (!parsedReplaceText && replaceText) {
    await interaction.reply({
      content: "replace_textの形式が不正です",
      ephemeral: true,
    });
    return;
  }

  try {
    await setWord(
      guildId,
      {
        baseWord: parsedTargetText,
        planeBaseWord: targetText,
        isRegex: isRegex,
      },
      replaceText && parsedReplaceText
        ? {
            targetWord: parsedReplaceText,
            planeTargetWord: replaceText,
          }
        : undefined
    );
    await interaction.reply({
      content: `言葉を設定しました\n${targetText} => ${replaceText ?? "***"}`,
    });
    const result = await getWords(guildId);
    console.log("Words in database:", result);
  } catch (e) {
    console.error("Error setting word:", e);
    await interaction.reply({
      content: "言葉の設定に失敗しました",
      ephemeral: true,
    });
    return;
  }
}
