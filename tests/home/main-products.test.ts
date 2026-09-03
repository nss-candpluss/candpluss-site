import { describe, expect, it } from "vitest";

import { homeMainProducts } from "@/data/home";

describe("home Main Products", () => {
  it("has a title and six dummy image frames with product link labels", () => {
    expect(homeMainProducts.title).toBe("Main Products");
    expect(homeMainProducts.items.map((item) => item.title)).toEqual([
      "MOYA500",
      "MOYA420",
      "NOKUTA",
      "ZIG STAKE",
      "KENJU",
      "ZIG HUMMER",
    ]);
    expect(homeMainProducts.items.map((item) => item.caption)).toEqual([
      "THE GRAND DOME SHELTER.",
      "THE GRAND DOME SHELTER.",
      "PROTECTION UNDER THE SKY.",
      "BUILT TO HOLD.",
      "STRENGTH MEETS VERSATILITY.",
      "THE FORGED DRIVING TOOL",
    ]);
    expect(homeMainProducts.link).toEqual({
      label: "ALL PRODUCTS",
      href: "/products",
    });
  });
});
