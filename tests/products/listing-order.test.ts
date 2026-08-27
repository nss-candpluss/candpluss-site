import { describe, expect, it } from "vitest";

import { sortProductsForListing } from "@/lib/products/helpers";

describe("sortProductsForListing", () => {
  it("orders products by listing category: tent, option, tarp, peg, accessory", () => {
    const sorted = sortProductsForListing([
      { handle: "patch", categorySlug: "accessory" },
      { handle: "stake", categorySlug: "peg-hammer" },
      { handle: "nokuta", categorySlug: "tarp" },
      { handle: "roof-sheet", categorySlug: "tent-option" },
      { handle: "moya500", categorySlug: "tent-shelter" },
    ]);

    expect(sorted.map((product) => product.handle)).toEqual([
      "moya500",
      "roof-sheet",
      "nokuta",
      "stake",
      "patch",
    ]);
  });

  it("keeps relative order within the same category", () => {
    const sorted = sortProductsForListing([
      { handle: "seam-grip", categorySlug: "accessory" },
      { handle: "inner", categorySlug: "tent-option" },
      { handle: "roof-sheet", categorySlug: "tent-option" },
      { handle: "moya500", categorySlug: "tent-shelter" },
    ]);

    expect(sorted.map((product) => product.handle)).toEqual([
      "moya500",
      "inner",
      "roof-sheet",
      "seam-grip",
    ]);
  });
});
