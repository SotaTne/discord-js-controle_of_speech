import {
  CommandInteraction,
  CommandInteractionOptionResolver,
} from "discord.js";
import { createRole, deleteAllRoles, setRole } from "../helper/roles.js";

export async function startExec(interaction: CommandInteraction) {
  const token = process.env.DISCORD_TOKEN;
  if (!token) {
    console.error("DISCORD_TOKEN is not set");
    throw new Error("DISCORD_TOKEN is not set");
  }
  if (!interaction.guild) {
    console.error("Guild not found");
    throw new Error("Guild not found");
  }
  const options = interaction.options as CommandInteractionOptionResolver;
  const time = options.getInteger("minute", false);
  await deleteAllRoles(interaction.guild);
  const cratedRole = await createRole(interaction.guild, time || undefined);
  await setRole(interaction.guild, cratedRole);
  await interaction.reply({
    content: `言論統制を開始しました。残り時間: ${time || 120}分`,
  });
  const key = process.env.SECRET_KEY;
  if (!key) {
    console.error("SECRET_KEY is not set");
    throw new Error("SECRET_KEY is not set");
  }
}

export async function stopExec(interaction: CommandInteraction) {
  const token = process.env.DISCORD_TOKEN;
  if (!token) {
    console.error("DISCORD_TOKEN is not set");
    throw new Error("DISCORD_TOKEN is not set");
  }
  if (!interaction.guild) {
    console.error("Guild not found");
    throw new Error("Guild not found");
  }
  await deleteAllRoles(interaction.guild);
  await interaction.reply({
    content: `言論統制を終了しました`,
  });
}
