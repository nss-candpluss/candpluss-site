import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../..");

describe("Shopify webhook", () => {
  const source = readFileSync(
    join(rootDir, "app/api/shopify/webhooks/route.ts"),
    "utf8"
  );

  it("HMAC 未設定・不正は拒否する（fail-closed）", () => {
    expect(source).toContain("timingSafeEqual");
    expect(source).toContain('if (!secret || !receivedHmac)');
    expect(source).toContain("return false");
    expect(source).toContain("status: 401");
  });

  it("検証前に JSON.parse しない（raw body で HMAC する）", () => {
    const hmacIndex = source.indexOf("isValidShopifyWebhook(body, hmac)");
    const parseIndex = source.indexOf("JSON.parse(body)");

    expect(hmacIndex).toBeGreaterThan(-1);
    expect(parseIndex).toBeGreaterThan(hmacIndex);
  });
});
