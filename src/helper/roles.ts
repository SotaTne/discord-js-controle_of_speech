import "dotenv/config";
import { createJWTRoleText } from "./role-jwt-helper.js";
import { Guild, Role } from "discord.js";

const token = process.env.DISCORD_TOKEN;
const applicationId = process.env.DISCORD_APPLICATION_ID;

export async function deleteAllRoles(guild: Guild) {
  try {
    const roles = guild.roles;
    const targetRoles = roles.cache.filter((role) => {
      return role.name.startsWith("token:");
    });
    await Promise.all(
      targetRoles.map(async (role) => {
        await role.delete();
      })
    );
  } catch (err) {
    console.error("Error fetching roles:", err);
    throw new Error("Error fetching roles");
  }
}

export async function deleteSelectRoles(roles: Role[]) {
  try {
    await Promise.all(
      roles.map(async (role) => {
        await role.delete();
      })
    );
  } catch (err) {
    console.error("Error deleting roles:", err);
    throw new Error("Error deleting roles");
  }
}

export async function createRole(
  guild: Guild,
  endMinuetsTime?: number
): Promise<Role> {
  try {
    const roleName = await createJWTRoleText(endMinuetsTime);
    const role = await guild.roles.create({
      name: `${roleName}`,
      color: "Blue",
      reason: "Created by bot",
    });
    return role;
  } catch (err) {
    console.error("Error creating role:", err);
    throw new Error("Error creating role");
  }
}

export async function getRoles(guild: Guild): Promise<Role[]> {
  try {
    return guild.roles.cache.map((role) => {
      return role;
    });
  } catch (err) {
    console.error("Error fetching roles:", err);
    throw new Error("Error fetching roles");
  }
}

export async function setRole(guild: Guild, role: Role) {
  try {
    const bot = await guild.members.fetch(applicationId!); // ← 修正ポイント
    await bot.roles.add(role);
  } catch (err) {
    console.error("Error setting role:", err);
    throw new Error("Error setting role");
  }
}

export async function getBotRoles(
  guildId: string
): Promise<{ id: string; name: string }[]> {
  const url = `https://discord.com/api/v10/guilds/${guildId}/members/${applicationId}/roles`;
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bot ${token}`,
        "Content-Type": "application/json",
      },
    });
    const data = (await response.json()) as {
      roles?: { id?: string; name?: string }[];
    };
    const roles = data.roles || [];
    return roles.map((role) => {
      return {
        id: role.id || "",
        name: role.name || "",
      };
    });
  } catch (err) {
    console.error("Error fetching bot roles:", err);
    throw new Error("Error fetching bot roles");
  }
}
