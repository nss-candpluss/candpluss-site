import { describe, expect, it } from "vitest";

import { clampCartQuantity, shouldRemoveCartLineOnDecrement } from "@/lib/commerce/cart-quantity";

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
