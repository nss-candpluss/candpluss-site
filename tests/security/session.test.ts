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

  it("verifies signed cart cookie values and rejects tampering", () => {
    const value = signCookieValue("gid://shopify/Cart/123?key=abc");

    expect(verifySignedCookieValue(value)).toBe(
      "gid://shopify/Cart/123?key=abc"
    );
    expect(verifySignedCookieValue(`${value}x`)).toBeNull();
  });
});
