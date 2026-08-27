import { describe, expect, it } from "vitest";

import { shouldDisplayProductPrice } from "@/lib/products/helpers";

describe("shouldDisplayProductPrice", () => {
  it("hides the price when the product amount is 0", () => {
    expect(shouldDisplayProductPrice({ price: 0 })).toBe(false);
  });

  it("hides the price when the selected variant amount is 0", () => {
    expect(
      shouldDisplayProductPrice(
        { price: 348620 },
        { price: { amount: 0, currencyCode: "JPY" } }
      )
    ).toBe(false);
  });

  it("shows the price when the amount is greater than 0", () => {
    expect(shouldDisplayProductPrice({ price: 348620 })).toBe(true);
    expect(
      shouldDisplayProductPrice(
        { price: 0 },
        { price: { amount: 1870, currencyCode: "JPY" } }
      )
    ).toBe(true);
  });
});
