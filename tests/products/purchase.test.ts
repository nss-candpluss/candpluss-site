import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { productAvailability } from "@/lib/json-ld";
import {
  canPurchaseProduct,
  isNonPurchasableStatus,
} from "@/lib/products/purchase";

import type { Product, ProductStatus } from "@/types/product";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../..");

/**
 * Shopify のメタオブジェクト `product_sales_status` に実在する6値と、
 * `availableForSale` が false のときのフォールバック soldOut。
 * 購入可否は PROJECT_RULES の表と一致させる。
 */
const shopifyStatuses = {
  available: true,
  preorder: true,
  ending: true,
  waiting: false,
  comingSoon: false,
  ended: false,
  soldOut: false,
} as const satisfies Partial<Record<ProductStatus, boolean>>;

function buildProduct(overrides: Partial<Product> = {}): Product {
  return {
    handle: "moya500",
    title: "MOYA500",
    status: "available" as ProductStatus,
    memberAccess: "public",
    variants: [
      {
        id: "cy",
        shopifyVariantId: "gid://shopify/ProductVariant/1",
        availableForSale: true,
        price: { amount: "372000", currencyCode: "JPY" },
      },
    ],
    ...overrides,
  } as unknown as Product;
}

describe("canPurchaseProduct", () => {
  /**
   * 以前は member_only 未登録を購入不可としていたため、先方が未登録の間は
   * 全17商品が カートに入れられない状態になっていた。
   */
  it("member_only 未登録でも購入できる", () => {
    const product = buildProduct({ memberAccessConfigured: false });

    expect(canPurchaseProduct(product, false)).toBe(true);
  });

  it("会員限定はログイン時のみ購入できる", () => {
    const product = buildProduct({ memberAccess: "memberOnly" });

    expect(canPurchaseProduct(product, false)).toBe(false);
    expect(canPurchaseProduct(product, true)).toBe(true);
  });

  it("Shopify の各ステータスの購入可否が PROJECT_RULES と一致する", () => {
    for (const [status, purchasable] of Object.entries(shopifyStatuses)) {
      expect(
        canPurchaseProduct(buildProduct({ status: status as ProductStatus }), true),
        status
      ).toBe(purchasable);
    }
  });

  /**
   * NEW は sales_status ではなく `custom.is_new` が担うため、購入可否とは無関係。
   * 以前 `new` を購入不可扱いしていたので、戻らないように固定する。
   */
  it("NEW は購入できる", () => {
    expect(canPurchaseProduct(buildProduct({ status: "new" }), false)).toBe(true);
    expect(isNonPurchasableStatus("new")).toBe(false);
  });
});

describe("isNonPurchasableStatus", () => {
  // カート API は Shopify のメタフィールドから生の文字列を受け取る
  it("未設定や未知の値は購入可として扱う", () => {
    expect(isNonPurchasableStatus(undefined)).toBe(false);
    expect(isNonPurchasableStatus(null)).toBe(false);
    expect(isNonPurchasableStatus("available")).toBe(false);
    expect(isNonPurchasableStatus("なにか未知の値")).toBe(false);
  });

  it("購入不可ステータスを判定する", () => {
    expect(isNonPurchasableStatus("soldOut")).toBe(true);
  });
});

// 判定が2か所に分かれてズレると、ボタンは押せるのに API が 409 を返す
describe("購入判定の二重定義", () => {
  it("カート API は共通の判定を使い、ステータス一覧を持たない", () => {
    const source = readFileSync(
      join(rootDir, "app/api/shopify/cart/route.ts"),
      "utf8"
    );

    expect(source).toContain("isNonPurchasableStatus(policy.status)");
    expect(source).not.toContain("blockedStatuses");
    expect(source).not.toContain("policy.memberAccessConfigured");
  });
});

describe("productAvailability", () => {
  it("購入できる商品は InStock", () => {
    expect(productAvailability(buildProduct())).toBe("https://schema.org/InStock");
  });

  // 構造化データとページの内容が食い違うと Google に不一致とみなされる
  it("カートに入れられない商品を InStock と宣言しない", () => {
    for (const [status, purchasable] of Object.entries(shopifyStatuses)) {
      if (purchasable) {
        continue;
      }

      const product = buildProduct({ status: status as ProductStatus });

      expect(productAvailability(product), status).not.toBe(
        "https://schema.org/InStock"
      );
    }
  });

  it("NEW は InStock のまま", () => {
    expect(productAvailability(buildProduct({ status: "new" }))).toBe(
      "https://schema.org/InStock"
    );
  });

  // 会員限定は「会員なら買える」ので在庫ありのまま
  it("会員限定は InStock のままにする", () => {
    expect(
      productAvailability(buildProduct({ memberAccess: "memberOnly" }))
    ).toBe("https://schema.org/InStock");
  });

  it("近日発売・入荷待ちは PreOrder を維持する", () => {
    for (const status of ["comingSoon", "waiting"] as const) {
      expect(productAvailability(buildProduct({ status }))).toBe(
        "https://schema.org/PreOrder"
      );
    }
  });
});
