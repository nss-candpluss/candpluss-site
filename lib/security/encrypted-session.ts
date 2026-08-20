import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

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
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
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

    const decipher = createDecipheriv(
      "aes-256-gcm",
      encryptionKey(),
      decodeBase64Url(ivValue)
    );
    decipher.setAuthTag(decodeBase64Url(authTagValue));
    const decrypted = Buffer.concat([
      decipher.update(decodeBase64Url(encryptedValue)),
      decipher.final(),
    ]);

    return JSON.parse(decrypted.toString("utf8")) as T;
  } catch {
    return null;
  }
}
