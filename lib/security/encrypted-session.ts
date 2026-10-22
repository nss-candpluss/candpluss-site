import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

const IV_LENGTH = 12;
// 指定しないと Node は 4 バイトまで切り詰めた認証タグも受け入れてしまう
const AUTH_TAG_LENGTH = 16;

function encryptionKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must contain at least 32 characters.");
  }

  return createHash("sha256").update(secret, "utf8").digest();
}

function decodeBase64Url(value: string) {
  const decoded = Buffer.from(value, "base64url");
  if (decoded.toString("base64url") !== value) {
    throw new Error("Invalid base64url encoding.");
  }
  return decoded;
}

export function encryptSession<T>(value: T) {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(value), "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [iv, authTag, encrypted]
    .map((part) => part.toString("base64url"))
    .join(".");
}

export function decryptSession<T>(value?: string | null): T | null {
  if (!value) {
    return null;
  }

  try {
    const parts = value.split(".");
    if (parts.length !== 3) {
      return null;
    }
    const [ivValue, authTagValue, encryptedValue] = parts;
    if (!ivValue || !authTagValue || !encryptedValue) {
      return null;
    }

    const iv = decodeBase64Url(ivValue);
    const authTag = decodeBase64Url(authTagValue);
    if (iv.length !== IV_LENGTH || authTag.length !== AUTH_TAG_LENGTH) {
      return null;
    }

    const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([
      decipher.update(decodeBase64Url(encryptedValue)),
      decipher.final(),
    ]);

    return JSON.parse(decrypted.toString("utf8")) as T;
  } catch {
    return null;
  }
}
