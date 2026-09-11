import { describe, expect, it } from "vitest";

import { sortProductsForListing, keepShopifyListingProducts } from "@/lib/products/helpers";

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

  it("keeps relative order within the same category when no order is configured", () => {
    const sorted = sortProductsForListing([
      { handle: "unlisted-b", categorySlug: "accessory" },
      { handle: "unlisted-a", categorySlug: "accessory" },
      { handle: "moya500", categorySlug: "tent-shelter" },
    ]);

    expect(sorted.map((product) => product.handle)).toEqual([
      "moya500",
      "unlisted-b",
      "unlisted-a",
    ]);
  });

  it("orders tent options MOYA500 first, then MOYA420", () => {
    const sorted = sortProductsForListing(
      [
        "moya420_innertent",
        "moya420_innertent-mesh",
        "moya420_groundsheet",
        "moya420_roofsheet",
        "moya500_tpu",
        "moya500_innertent",
        "moya500_innertent-mesh",
        "moya500_groundsheet",
        "moya500_roofsheet",
      ].map((handle) => ({ handle, categorySlug: "tent-option" }))
    );

    expect(sorted.map((product) => product.handle)).toEqual([
      "moya500_roofsheet",
      "moya500_groundsheet",
      "moya500_innertent",
      "moya500_innertent-mesh",
      "moya500_tpu",
      "moya420_roofsheet",
      "moya420_groundsheet",
      "moya420_innertent",
      "moya420_innertent-mesh",
    ]);
  });

  it("orders accessories with the rope and adjuster before the GEARAID items", () => {
    const sorted = sortProductsForListing(
      [
        "gearaid-seam-grip",
        "gearaid-sil-nylon-patch",
        "guyrope",
        "triangle-guylineadjuster",
      ].map((handle) => ({ handle, categorySlug: "accessory" }))
    );

    expect(sorted.map((product) => product.handle)).toEqual([
      "guyrope",
      "triangle-guylineadjuster",
      "gearaid-seam-grip",
      "gearaid-sil-nylon-patch",
    ]);
  });

  it("puts products without a configured order after the configured ones", () => {
    const sorted = sortProductsForListing(
      ["new-accessory", "gearaid-seam-grip", "guyrope"].map((handle) => ({
        handle,
        categorySlug: "accessory",
      }))
    );

    expect(sorted.map((product) => product.handle)).toEqual([
      "guyrope",
      "gearaid-seam-grip",
      "new-accessory",
    ]);
  });
});

describe("keepShopifyListingProducts", () => {
  it("drops local-only products and hidden listings", () => {
    const visible = keepShopifyListingProducts(
      [
        { handle: "moya500", listingHidden: false },
        { handle: "local-only" },
        { handle: "hidden-shopify", listingHidden: true },
        { handle: "roof-sheet" },
      ],
      new Set(["moya500", "roof-sheet", "hidden-shopify"])
    );

    expect(visible.map((product) => product.handle)).toEqual([
      "moya500",
      "roof-sheet",
    ]);
  });
});
