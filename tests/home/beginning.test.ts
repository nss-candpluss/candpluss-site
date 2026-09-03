import { describe, expect, it } from "vitest";

import { topHeroContent } from "@/data/home";

describe("top hero OUR BEGINNING copy", () => {
  it("uses the current beginning title and has no mid-label", () => {
    expect(topHeroContent.beginning.title).toBe("Camp + Something.");
    expect(topHeroContent.beginning).not.toHaveProperty("label");
    expect(topHeroContent).not.toHaveProperty("beginningImage");
  });

  it("uses the current beginning body lines", () => {
    expect(topHeroContent.beginning.bodyLines).toEqual([
      "キャンプと、大切なものをつなぐ。",
      "C AND+Sは、道具と空間を通して、人それぞれの大切な“Something”とキャンプをつなぎます。",
      "自然の中で過ごす時間を、もっと心地よく、美しく、自由に。",
      "What’s Your + S ?",
    ]);
  });

  it("links to concept with READ MORE label", () => {
    expect(topHeroContent.beginning.link).toEqual({
      label: "READ MORE",
      href: "/concept",
    });
  });
});
