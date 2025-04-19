import {
  CommandInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
} from "discord.js";
import { startExec, stopExec } from "../src/command/start_and_stop.js";
import { addWordExec } from "../src/command/word.js";

export type cmdName = "start" | "stop" | "aw" | "wl" | "wlf" | "dw";

class exSlashCommandBuilder extends SlashCommandBuilder {
  setName(name: cmdName) {
    return super.setName(name.toLocaleLowerCase());
  }
}

export const commands: {
  data: SlashCommandOptionsOnlyBuilder;
  exec: (interaction: CommandInteraction) => Promise<void>;
}[] = [
  {
    data: new exSlashCommandBuilder()
      .setName("start")
      .setDescription("言論統制を開始します")
      .addIntegerOption((option) => {
        return option.setName("minute").setDescription("言論統制の時間(分)");
      }),
    exec: startExec,
  },
  {
    data: new exSlashCommandBuilder()
      .setName("stop")
      .setDescription("言論統制を終了します"),
    exec: stopExec,
  },
  {
    data: new exSlashCommandBuilder()
      .setName("aw")
      .setDescription("言論統制の内容の追加")
      .addStringOption((option) => {
        return option
          .setName("target_text")
          .setDescription("言論統制の対象のテキスト")
          .setRequired(true);
      })
      .addStringOption((option) => {
        return option
          .setName("replace_text")
          .setDescription("変換後のテキスト");
      })
      .addBooleanOption((option) => {
        return option
          .setName("is_regex")
          .setDescription("正規表現を使用するかどうか");
      }),
    exec: addWordExec,
  },
  // {
  //   data: new exSlashCommandBuilder()
  //     .setName("wl")
  //     .setDescription("言論統制一覧の確認"),
  // },
  // {
  //   data: new exSlashCommandBuilder()
  //     .setName("wlf")
  //     .setDescription("言論統制一覧のファイルでの確認"),
  // },
  // {
  //   data: new exSlashCommandBuilder()
  //     .setName("dw")
  //     .setDescription("言論統制の内容の削除")
  //     .addStringOption((option) => {
  //       return option
  //         .setName("target_text") // ← 修正ポイント
  //         .setDescription("言論統制の対象のテキスト")
  //         .setRequired(true);
  //     }),
  // },
  // {
  //   data: new exSlashCommandBuilder()
  //     .setName("af")
  //     .setDescription(
  //       "ファイルによる言論統制の内容の追加(アナルファックではない)"
  //     )
  //     .addAttachmentOption((option) => {
  //       return option
  //         .setName("file")
  //         .setDescription("言論統制の対象のテキスト")
  //         .setRequired(true);
  //     }),
  // },
];
