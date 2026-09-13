import { describe, expect, it } from "vitest";

import {
  getProductDetailHref,
  normalizeProductHandle,
} from "@/lib/products/helpers";

describe("normalizeProductHandle", () => {
  it("decodes percent-encoded Japanese handles used in product URLs", () => {
    expect(normalizeProductHandle("%E3%83%AB%E3%83%BC%E3%83%95%E3%82%B7%E3%83%BC%E3%83%88")).toBe(
      "ルーフシート"
    );
  });

  it("keeps already-decoded handles unchanged", () => {
    expect(normalizeProductHandle("ルーフシート")).toBe("ルーフシート");
    expect(normalizeProductHandle("moya500")).toBe("moya500");
  });
});

describe("getProductDetailHref", () => {
  it("keeps the color query for selectable variants", () => {
    expect(getProductDetailHref("moya500", "cy")).toBe("/products/moya500?color=cy");
    expect(getProductDetailHref("zig-stake", "20cm")).toBe(
      "/products/zig-stake?color=20cm"
    );
  });

  // Shopify の Default Title 由来の ID は選択肢にならないため URL に出さない
  it("omits the color query for placeholder variants", () => {
    expect(getProductDetailHref("guyrope", "default-title")).toBe("/products/guyrope");
    expect(getProductDetailHref("guyrope", "default")).toBe("/products/guyrope");
    expect(getProductDetailHref("guyrope")).toBe("/products/guyrope");
  });
});
