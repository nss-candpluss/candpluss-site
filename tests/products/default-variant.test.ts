import { describe, expect, it } from "vitest";

import { productDefaultColorNameByHandlePrefix } from "@/data/product-default-variants";
import { getSelectedVariant, resolveProductVariantId } from "@/lib/products/helpers";
import type { Product, ProductVariant } from "@/types/product";

function variant(
  id: string,
  colorName: string
): Pick<ProductVariant, "id" | "colorName"> {
  return { id, colorName };
}

function product(
  handle: string,
  variants: Array<Pick<ProductVariant, "id" | "colorName">>
): Product {
  return {
    handle,
    variants,
  } as Product;
}

const moya420Colors = [
  variant("classic-yellow", "Classic Yellow"),
  variant("gold-beige", "Gold Beige"),
  variant("shadow-gray", "Shadow Gray"),
];

describe("MOYA420 の初期選択色", () => {
  it("Shadow Gray を初期選択にし、チップ順は入れ替えない", () => {
    expect(productDefaultColorNameByHandlePrefix).toEqual([
      { handlePrefix: "moya420", colorName: "Shadow Gray" },
    ]);

    const moya420 = product("moya420", moya420Colors);
    const roofsheet = product("moya420_roofsheet", [
      variant("classic-yellow", "CLASSIC YELLOW"),
      variant("gold-beige", "GOLD BEIGE"),
      variant("shadow-gray", "SHADOW GRAY"),
    ]);

    expect(resolveProductVariantId(moya420)).toBe("shadow-gray");
    expect(resolveProductVariantId(roofsheet)).toBe("shadow-gray");
    expect(moya420.variants.map((item) => item.id)).toEqual([
      "classic-yellow",
      "gold-beige",
      "shadow-gray",
    ]);
  });

  it("URL で指定した色は初期選択より優先する", () => {
    expect(
      resolveProductVariantId(product("moya420", moya420Colors), "shadow-gray")
    ).toBe("shadow-gray");
  });

  it("MOYA500 など他商品の初期選択は先頭のまま", () => {
    const moya500 = product("moya500", moya420Colors);

    expect(resolveProductVariantId(moya500)).toBe("classic-yellow");
    expect(getSelectedVariant(moya500)?.id).toBe("classic-yellow");
  });

  it("Shadow Gray が無い MOYA420 は先頭バリアントに戻す", () => {
    expect(
      resolveProductVariantId(
        product("moya420_groundsheet", [variant("default-title", "Default Title")])
      )
    ).toBe("default-title");
  });
});
