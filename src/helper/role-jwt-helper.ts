import { deleteSelectRoles } from "./roles.js";
import { sign, verify } from "./mini-jwt.js";
import { Role } from "discord.js";
import "dotenv/config";

const secret_key = process.env.SECRET_KEY || "";

export async function checkJWTRole(inputRoles: Role[]) {
  const key = secret_key;
  console.log(inputRoles.map((role) => role.name));
  const roles = inputRoles.filter((role) => role.name.startsWith("token:"));
  console.log(roles);
  if (roles.length == 0) {
    console.error("Invalid role text");
    throw new Error("Invalid role text");
  }
  let flag = false;
  let deleteStack: Role[] = [];
  await Promise.all(
    roles.map(async (role) => {
      console.log(role.name);
      if (await checkRole(role, key)) {
        console.log("Checked role:", role.name);
        flag = true;
      } else {
        console.error("Invalid role text");
        // ロールの削除
        deleteStack.push(role);
      }
    })
  );
  console.log(deleteStack);
  await deleteSelectRoles(deleteStack);
  if (!flag) {
    console.error("Invalid role text");
    throw new Error("Invalid role text");
  }
}

async function checkRole(role: Role, key: string): Promise<boolean> {
  const roleTexts: string[] = role.name.split(":");
  console.log(roleTexts);

  if (roleTexts.length !== 2 || roleTexts[0] !== "token") {
    console.error("Invalid role text");
    return false;
  }
  console.log();
  const decoded = await verify(roleTexts[1], key);
  console.log("decoded", decoded);

  if (!decoded || typeof decoded !== "object") {
    console.error("Invalid role text");
    return false;
  }

  const payload: { [_key: string]: any } = decoded;

  // 有効期限の確認

  if (!payload.exp || payload.exp < Date.now() / 1000) {
    console.error("Expired token");
    return false;
  }
  return true;
}

export async function createJWTRoleText(
  endMinuetsTime: number = 120
): Promise<string> {
  const payload: { [key: string]: any } = {
    exp: new Date().getTime() / 1000 + Math.max(endMinuetsTime, 1) * 60,
  };
  const key: string = secret_key;
  const text = await sign(payload, key);
  return "token:" + text;
}
