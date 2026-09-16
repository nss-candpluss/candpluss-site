import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { clampCartQuantity, shouldRemoveCartLineOnDecrement } from "@/lib/commerce/cart-quantity";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../..");

function readSource(relativePath: string) {
  return readFileSync(join(rootDir, relativePath), "utf8");
}

describe("clampCartQuantity", () => {
  it("keeps a valid integer in range", () => {
    expect(clampCartQuantity(2, 1)).toBe(2);
    expect(clampCartQuantity("8", 1)).toBe(8);
  });

  it("falls back when the value is empty or not a number", () => {
    expect(clampCartQuantity("", 3)).toBe(3);
    expect(clampCartQuantity("abc", 3)).toBe(3);
  });

  it("clamps below the minimum to 1", () => {
    expect(clampCartQuantity(0, 2)).toBe(1);
    expect(clampCartQuantity("-4", 2)).toBe(1);
  });

  it("clamps above the maximum to 99", () => {
    expect(clampCartQuantity(100, 2)).toBe(99);
    expect(clampCartQuantity("120", 2)).toBe(99);
  });
});

describe("shouldRemoveCartLineOnDecrement", () => {
  it("removes when the committed quantity is 1", () => {
    expect(shouldRemoveCartLineOnDecrement(1)).toBe(true);
  });

  it("decrements when the committed quantity is above 1", () => {
    expect(shouldRemoveCartLineOnDecrement(2)).toBe(false);
  });
});

describe("CartQuantityStepper", () => {
  const source = readSource("components/commerce/CartQuantityStepper.tsx");

  it("確定後は下書きを捨ててカートの数量を表示する", () => {
    // 下書きを残すと、要求より少ない数量が返ったときに入力欄だけ希望値のままになる。
    expect(source).toContain("useState<string | null>(null)");
    expect(source).toContain("value={draft ?? String(value)}");
    expect(source).toContain("setDraft(null)");
  });

  it("増減ボタンは下書きではなく確定済みの数量を基準にする", () => {
    expect(source).toContain("commit(value - 1)");
    expect(source).toContain("commit(value + 1)");
    expect(source).toContain("value < CART_QUANTITY_MAX");
  });
});

describe("カート更新の在庫切り詰め通知", () => {
  it("要求より少ない数量が返ったら知らせる", () => {
    // Shopify は在庫不足でもエラーにせず、在庫数まで切り詰めた数量を返す。
    const source = readSource("components/commerce/CartProvider.tsx");
    expect(source).toContain("line.quantity < quantity");
    expect(source).toContain("在庫の上限により");
  });
});
