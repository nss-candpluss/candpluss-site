import { describe, expect, it } from "vitest";

import { headerIconLinks } from "@/data/navigation";
import { isHeaderIconLinkVisible } from "@/lib/site-navigation-visibility";

describe("header icon visibility", () => {
  it("hides the search icon", () => {
    expect(headerIconLinks.some((link) => link.label === "Search")).toBe(true);
    expect(isHeaderIconLinkVisible("Search")).toBe(false);
    expect(isHeaderIconLinkVisible("User")).toBe(true);
    expect(isHeaderIconLinkVisible("Cart")).toBe(true);
  });
});
