import { createCipheriv, createHash, randomBytes } from "node:crypto";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  decryptSession,
  encryptSession,
} from "@/lib/security/encrypted-session";
import {
  signCookieValue,
  verifySignedCookieValue,
} from "@/lib/security/signed-cookie";

describe("commerce session security", () => {
  const originalSecret = process.env.SESSION_SECRET;

  beforeEach(() => {
    process.env.SESSION_SECRET = "test-secret-with-at-least-thirty-two-characters";
  });

  afterEach(() => {
    process.env.SESSION_SECRET = originalSecret;
  });

  it("round-trips encrypted sessions and rejects tampering", () => {
    const value = encryptSession({ accessToken: "secret", expiresAt: 123 });

    expect(
      decryptSession<{ accessToken: string; expiresAt: number }>(value)
    ).toEqual({ accessToken: "secret", expiresAt: 123 });
    expect(decryptSession(`${value.slice(0, -1)}x`)).toBeNull();
  });

  it("rejects sessions whose auth tag has been truncated", () => {
    const [iv, authTag, encrypted] = encryptSession({ accessToken: "secret" }).split(".");
    const truncatedTag = Buffer.from(authTag, "base64url")
      .subarray(0, 4)
      .toString("base64url");

    expect(decryptSession(`${iv}.${truncatedTag}.${encrypted}`)).toBeNull();
  });

  it("still decrypts sessions issued without an explicit auth tag length", () => {
    const key = createHash("sha256")
      .update(process.env.SESSION_SECRET ?? "", "utf8")
      .digest();
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", key, iv);
    const encrypted = Buffer.concat([
      cipher.update(JSON.stringify({ accessToken: "secret" }), "utf8"),
      cipher.final(),
    ]);
    const value = [iv, cipher.getAuthTag(), encrypted]
      .map((part) => part.toString("base64url"))
      .join(".");

    expect(decryptSession(value)).toEqual({ accessToken: "secret" });
  });

  it("verifies signed cart cookie values and rejects tampering", () => {
    const value = signCookieValue("gid://shopify/Cart/123?key=abc");

    expect(verifySignedCookieValue(value)).toBe(
      "gid://shopify/Cart/123?key=abc"
    );
    expect(verifySignedCookieValue(`${value}x`)).toBeNull();
  });
});
