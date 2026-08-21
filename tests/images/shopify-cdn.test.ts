import { describe, expect, it } from "vitest";

import {
  isShopifyCdnUrl,
  shopifyDeliveryWidth,
  withShopifyCdnWidth,
} from "@/lib/images/shopify-cdn";

const shopifySrc =
  "https://cdn.shopify.com/s/files/1/1/files/moya500-cy-gallery-01.webp?v=123";

describe("shopify-cdn", () => {
  it("detects Shopify CDN URLs only", () => {
    expect(isShopifyCdnUrl(shopifySrc)).toBe(true);
    expect(isShopifyCdnUrl("/images/products/moya500/moya500-cy-gallery-01.webp")).toBe(
      false
    );
  });

  it("adds a delivery width without dropping the cache token", () => {
    expect(withShopifyCdnWidth(shopifySrc, 320)).toBe(
      "https://cdn.shopify.com/s/files/1/1/files/moya500-cy-gallery-01.webp?v=123&width=320"
    );
  });

  it("uses a chip-sized delivery width for 54px color chips", () => {
    expect(shopifyDeliveryWidth({ width: 54 })).toBe(320);
  });

  it("uses a chip-sized delivery width for 70px gallery thumbs", () => {
    expect(shopifyDeliveryWidth({ sizes: "70px" })).toBe(320);
  });

  it("uses a larger width for listing and hero sizes", () => {
    expect(
      shopifyDeliveryWidth({ sizes: "(min-width: 1024px) 33vw, 100vw" })
    ).toBe(1400);
    expect(shopifyDeliveryWidth({ sizes: "(min-width: 1025px) 56vw" })).toBe(2400);
  });
});
