import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { evaluateCartMerchandisePolicy } from "@/lib/commerce/cart-policy";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../..");

function readSource(relativePath: string) {
  return readFileSync(join(rootDir, relativePath), "utf8");
}

describe("evaluateCartMerchandisePolicy", () => {
  it("販売中は通す", () => {
    expect(
      evaluateCartMerchandisePolicy(
        { availableForSale: true, memberOnly: false, status: "available" },
        false
      )
    ).toEqual({ ok: true });
  });

  it("販売終了・在庫切れは 409", () => {
    expect(
      evaluateCartMerchandisePolicy(
        { availableForSale: true, memberOnly: false, status: "ended" },
        true
      )
    ).toMatchObject({ ok: false, status: 409 });
    expect(
      evaluateCartMerchandisePolicy(
        { availableForSale: false, memberOnly: false, status: "available" },
        true
      )
    ).toMatchObject({ ok: false, status: 409 });
  });

  it("会員限定は未ログインなら 403、ログインなら通す", () => {
    const policy = {
      availableForSale: true,
      memberOnly: true,
      status: "available",
    };

    expect(evaluateCartMerchandisePolicy(policy, false)).toMatchObject({
      ok: false,
      status: 403,
    });
    expect(evaluateCartMerchandisePolicy(policy, true)).toEqual({ ok: true });
  });
});

describe("カート API の購入ポリシー", () => {
  const source = readSource("app/api/shopify/cart/route.ts");

  it("POST と数量増加の PATCH が同じ判定を使う", () => {
    expect(source).toContain("evaluateCartMerchandisePolicy");
    expect(source).toContain("getCartMerchandisePolicy(line.merchandise.id)");
    expect(source).toContain("input.quantity > line.quantity");
  });

  it("数量を減らす・削除するときは再検証しない", () => {
    expect(source).toContain("if (input.quantity === 0)");
    expect(source).toContain("removeCartLines");
  });

  it("Shopify の生エラーをクライアントに返さない", () => {
    expect(source).toContain('"Cart request failed."');
    expect(source).not.toContain(
      '{ error: configurationError ? "Commerce is not configured." : message }'
    );
  });
});
