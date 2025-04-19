import { Client, Events, GatewayIntentBits } from "discord.js";
import { server } from "./server.js";
import { commands } from "../data/commands.js";
import { getRoles } from "./helper/roles.js";
import { checkJWTRole } from "./helper/role-jwt-helper.js";
import { getWords } from "./helper/database.js";
import { ParsedWord } from "./helper/textParser.js";
import { replaceText } from "./helper/replacer.js";

const PORT = 8000;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`サーバーが起動しました: http://localhost:${PORT}`);
});

client.once(Events.ClientReady, async () => {
  console.log(`Logged in as ${client.user?.tag}!`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  console.log("Interaction received:", interaction);
  if (!interaction.isCommand()) return;
  const command = commands.find(
    (cmd) => cmd.data.name === interaction.commandName
  );
  if (!command) {
    await interaction.reply("Unknown command");
    return;
  }
  try {
    await command.exec(interaction);
  } catch (error) {
    console.error("Error executing command:", error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply("コマンドの処理中にエラーが発生しました。");
    } else {
      await interaction.followUp("コマンドの処理中にエラーが発生しました。");
    }
  }
});

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot || !message.guild) {
    //メッセージの送信者がBOTなら
    return; //returnしてこの先の処理をさせない。
  }
  const n = await getRoles(message.guild);
  if (n.length == 0) {
    return;
  }
  try {
    await checkJWTRole(n);
    await message.delete();
    const messageContent = message.content;
    const sender = message.author.id;
    const wordsPattern = await getWords(message.guild.id);
    const replaced = replaceText(wordsPattern, messageContent);
    await message.channel.send(
      `精査済みのメッセージ\n ${replaced} \n送信者: <@${sender}>`
    );
  } catch (error) {
    console.error("Error checking JWT role:", error);
  }
});

process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection:", error);
});

client.login(process.env.DISCORD_TOKEN);
