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
  it("shows a single chip even for Shopify Default Title products", () => {
    expect(
      shouldDisplayProductVariantOptions({
        variants: [variant("Default Title")],
      })
    ).toBe(true);
  });

  it("shows a chip when there is only one real color or size", () => {
    expect(
      shouldDisplayProductVariantOptions({
        variants: [variant("Classic Yellow")],
      })
    ).toBe(true);
  });

  it("shows chips when two or more options exist", () => {
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

  it("hides the label when there is only one real option", () => {
    expect(
      shouldDisplayProductVariantLabel(
        { variants: [variant("Classic Yellow")] },
        variant("Classic Yellow")
      )
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
