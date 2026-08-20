import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) {
    throw new Error("SESSION_SECRET must contain at least 32 characters.");
  }
  return value;
}

function signature(value: string) {
  return createHmac("sha256", secret()).update(value, "utf8").digest("base64url");
}

export function signCookieValue(value: string) {
  return `${value}.${signature(value)}`;
}

export function verifySignedCookieValue(signedValue?: string | null) {
  if (!signedValue) {
    return null;
  }

  const separator = signedValue.lastIndexOf(".");
  if (separator <= 0) {
    return null;
  }

  const value = signedValue.slice(0, separator);
  const received = signedValue.slice(separator + 1);
  const expected = signature(value);
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);

  return receivedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(receivedBuffer, expectedBuffer)
    ? value
    : null;
}
