import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { productStatusDisplayOverrides } from "@/data/product-status-overrides";
import {
  getProductStatusDisplayOverride,
  hasProductStatusLabel,
} from "@/components/products/ProductStatusLabel";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../..");

function readSource(relativePath: string) {
  return readFileSync(join(rootDir, relativePath), "utf8");
}

describe("商品ステータスの表示差し替え", () => {
  it("MOYA500 / MOYA420 だけ赤字のテスト文言に差し替える", () => {
    expect(productStatusDisplayOverrides.moya500).toEqual({
      label: "2026年10月2日(金) 20:00〜発売",
      color: "#c40000",
    });
    expect(productStatusDisplayOverrides.moya420).toEqual({
      label: "2027年春 発売予定",
      color: "#c40000",
    });
    expect(getProductStatusDisplayOverride("moya500_roofsheet")).toBeUndefined();
    expect(getProductStatusDisplayOverride("nokuta")).toBeUndefined();
  });

  it("差し替え対象はステータス欄を必ず出す", () => {
    expect(hasProductStatusLabel("available", undefined, "moya500")).toBe(true);
    expect(hasProductStatusLabel("available", undefined)).toBe(false);
  });

  it("購入判定は変えない", () => {
    expect(readSource("lib/products/purchase.ts")).not.toContain(
      "productStatusDisplayOverrides"
    );
    expect(readSource("lib/shopify/products.ts")).not.toContain(
      "productStatusDisplayOverrides"
    );
  });
});
