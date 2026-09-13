import { describe, expect, it } from "vitest";

import { getProductOgImage } from "@/lib/products/gallery";
import { PRODUCT_IMAGE_PLACEHOLDER } from "@/lib/products/image-paths";

import type { Product } from "@/types/product";

function buildProduct(imageSrc: string): Product {
  return {
    handle: "moya500",
    title: "MOYA500",
    category: "テント・シェルター",
    categorySlug: "tents",
    description: "説明文です。",
    variants: [
      {
        id: "cy",
        colorName: "Classic Yellow",
        gallery: {
          type: "standard",
          images: [{ src: imageSrc, alt: "MOYA500" }],
        },
      },
    ],
  } as unknown as Product;
}

const SHOPIFY_IMAGE =
  "https://cdn.shopify.com/s/files/1/0687/6240/2914/files/moya_y02.webp?v=1788937153";

describe("getProductOgImage", () => {
  it("Shopify CDN の画像を 1200×630 で切り出す", () => {
    const ogImage = getProductOgImage(buildProduct(SHOPIFY_IMAGE));

    expect(ogImage).toEqual({
      url: `${SHOPIFY_IMAGE}&width=1200&height=630&crop=center`,
      width: 1200,
      height: 630,
    });
  });

  // format=jpg は Accept より優先されないため付けない（CDN が Accept で出し分ける）
  it("形式は CDN の出し分けに任せて format を付けない", () => {
    expect(getProductOgImage(buildProduct(SHOPIFY_IMAGE))?.url).not.toContain(
      "format="
    );
  });

  /**
   * ローカルのプレースホルダーは WebP で、Shopify と違って Accept による
   * 出し分けがない。LINE で表示されないため共通 OG 画像に委ねる。
   */
  it("Shopify 以外の画像では undefined を返して共通 OG 画像に委ねる", () => {
    expect(getProductOgImage(buildProduct(PRODUCT_IMAGE_PLACEHOLDER))).toBeUndefined();
  });
});
