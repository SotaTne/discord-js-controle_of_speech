import { webcrypto } from "crypto";
import { brotliCompressSync, brotliDecompressSync } from "zlib";

// UTF-8 のエンコーダ／デコーダ
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder("utf-8");

export function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const b64 = btoa(binary);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function base64UrlDecode(b64url: string): Uint8Array {
  let b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  b64 += "=".repeat((4 - (b64.length % 4)) % 4);
  const binary = atob(b64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function encodePayload(payload: object): string {
  const json = JSON.stringify(payload);
  const utf8 = textEncoder.encode(json);
  console.log("utf8", Buffer.from(utf8));

  const compressed = brotliCompressSync(Buffer.from(utf8));
  console.log("compressed", compressed);
  return base64UrlEncode(new Uint8Array(compressed));
}

export async function signString(
  encodedPayload: string,
  privateKey: string
): Promise<string> {
  const key = await generateKey(privateKey);
  const data = textEncoder.encode(encodedPayload);
  const sig = await crypto.subtle.sign(
    { name: "HMAC", hash: "SHA-256" },
    key,
    data
  );
  return base64UrlEncode(new Uint8Array(sig));
}

export async function sign(
  payload: object,
  privateKey: string
): Promise<string> {
  const encoded = encodePayload(payload);
  const signature = await signString(encoded, privateKey);
  console.log("encoded", encoded);
  return `${encoded}.${signature}`;
}

export async function verify(
  token: string,
  privateKey: string
): Promise<object | false> {
  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [encodedPayload, encodedSig] = parts;
  const key = await generateKey(privateKey);

  // 1) 署名チェック
  const valid = await crypto.subtle.verify(
    { name: "HMAC", hash: "SHA-256" },
    key,
    base64UrlDecode(encodedSig),
    textEncoder.encode(encodedPayload)
  );
  if (!valid) return false;

  // 2) ペイロード復元
  const compressed = base64UrlDecode(encodedPayload);
  const utf8 = brotliDecompressSync(Buffer.from(compressed));
  const json = textDecoder.decode(new Uint8Array(utf8));
  return JSON.parse(json);
}

export function generateKey(keyData: string): Promise<webcrypto.CryptoKey> {
  const bytes = new Uint8Array(Array.from(keyData).map((c) => c.charCodeAt(0)));
  return crypto.subtle.importKey(
    "raw",
    bytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}
