import { describe, expect, it } from "vitest";

import {
  shouldDisplayProductVariantLabel,
  shouldDisplayProductVariantOptions,
} from "@/lib/products/helpers";
import type { ProductVariant } from "@/types/product";

function variant(colorName: string): Pick<ProductVariant, "colorName"> {
  return { colorName };
}

describe("shouldDisplayProductVariantOptions", () => {
  it("hides Shopify Default Title products that have no real options", () => {
    expect(
      shouldDisplayProductVariantOptions({
        variants: [variant("Default Title")],
      })
    ).toBe(false);
  });

  it("hides a single real color or size", () => {
    expect(
      shouldDisplayProductVariantOptions({
        variants: [variant("Classic Yellow")],
      })
    ).toBe(false);
  });

  it("shows when two or more real options exist", () => {
    expect(
      shouldDisplayProductVariantOptions({
        variants: [variant("20cm"), variant("30cm")],
      })
    ).toBe(true);
  });
});

describe("shouldDisplayProductVariantLabel", () => {
  it("does not render COLOR : Default Title", () => {
    const product = { variants: [variant("Default Title")] };

    expect(
      shouldDisplayProductVariantLabel(product, variant("Default Title"))
    ).toBe(false);
  });

  it("shows the selected option when there are multiple real variants", () => {
    const product = {
      variants: [variant("Classic Yellow"), variant("Gold Beige")],
    };

    expect(
      shouldDisplayProductVariantLabel(product, variant("Classic Yellow"))
    ).toBe(true);
  });
});
