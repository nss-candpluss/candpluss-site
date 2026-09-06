import { describe, expect, it } from "vitest";

import { homeMainProducts } from "@/data/home";
import {
  MAIN_PRODUCTS_THREE_COLUMN_MIN_COUNT,
  mainProductCardAspectClassName,
  mainProductCardSpanClassName,
  twoColumnFeatureSpanClassName,
} from "@/lib/layout";

describe("home Main Products", () => {
  it("has a title and four product image links", () => {
    expect(homeMainProducts.title).toBe("Main Products");
    expect(homeMainProducts.items.map((item) => item.title)).toEqual([
      "MOYA500",
      "MOYA420",
      "NOKUTA",
      "ZIG STAKE",
    ]);
    expect(homeMainProducts.items.map((item) => item.caption)).toEqual([
      "THE GRAND DOME SHELTER.",
      "THE GRAND DOME SHELTER.",
      "PROTECTION UNDER THE SKY.",
      "BUILT TO HOLD.",
    ]);
    expect(homeMainProducts.items.map((item) => item.image)).toEqual([
      "/images/home/home-link-moya500.webp",
      "/images/home/home-link-moya420.webp",
      "/images/home/home-link-nokuta.webp",
      "/images/home/home-link-zigstake.webp",
    ]);
    expect(homeMainProducts.link).toEqual({
      label: "ALL PRODUCTS",
      href: "/products",
    });
    expect(homeMainProducts.items.length).toBeLessThan(
      MAIN_PRODUCTS_THREE_COLUMN_MIN_COUNT
    );
    expect(mainProductCardSpanClassName(homeMainProducts.items.length)).toBe(
      twoColumnFeatureSpanClassName
    );
    expect(mainProductCardAspectClassName(homeMainProducts.items.length)).toBe(
      "aspect-[13/10]"
    );
  });
});
