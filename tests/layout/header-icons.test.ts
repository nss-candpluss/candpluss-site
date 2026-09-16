import { describe, expect, it } from "vitest";

import { headerIconLinks } from "@/data/navigation";
import { isHeaderIconLinkVisible } from "@/lib/site-navigation-visibility";

describe("header icon visibility", () => {
  // カートと会員は系統で出し分ける（isHeaderIconLinkVisibleInChannel）
  it("hides the search icon and keeps the cart and user icons", () => {
    expect(headerIconLinks.some((link) => link.label === "Search")).toBe(true);
    expect(headerIconLinks.some((link) => link.label === "User")).toBe(true);
    expect(isHeaderIconLinkVisible("Search")).toBe(false);
    expect(isHeaderIconLinkVisible("User")).toBe(true);
    expect(isHeaderIconLinkVisible("Cart")).toBe(true);
  });
});
