import { describe, expect, it } from "vitest";

import {
  getProductDetailHref,
  getProductVariantParamName,
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

describe("getProductVariantParamName", () => {
  // Shopify のオプション名から自動で決まるため、商品追加時のサイト側設定は不要
  it("derives the query name from the Shopify option name", () => {
    expect(getProductVariantParamName({ variantOptionName: "COLOR" })).toBe("color");
    expect(getProductVariantParamName({ variantOptionName: "SIZE" })).toBe("size");
  });

  it("falls back to color when the option name is missing or not slug-able", () => {
    expect(getProductVariantParamName({ variantOptionName: undefined })).toBe("color");
    expect(getProductVariantParamName({ variantOptionName: "サイズ" })).toBe("color");
  });
});

describe("getProductDetailHref", () => {
  // zig-stake は Shopify のオプション名が Size なので ?size= になる
  it("names the query after the Shopify option", () => {
    expect(
      getProductDetailHref({ handle: "moya500", variantOptionName: "COLOR" }, "cy")
    ).toBe("/products/moya500?color=cy");
    expect(
      getProductDetailHref({ handle: "zig-stake", variantOptionName: "SIZE" }, "20cm")
    ).toBe("/products/zig-stake?size=20cm");
  });

  // Shopify の Default Title 由来の ID は選択肢にならないため URL に出さない
  it("omits the query for placeholder variants", () => {
    const guyrope = { handle: "guyrope", variantOptionName: undefined };

    expect(getProductDetailHref(guyrope, "default-title")).toBe("/products/guyrope");
    expect(getProductDetailHref(guyrope, "default")).toBe("/products/guyrope");
    expect(getProductDetailHref(guyrope)).toBe("/products/guyrope");
  });
});
