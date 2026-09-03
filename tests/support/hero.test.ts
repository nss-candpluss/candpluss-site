import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { supportContent } from "@/data/support";

const supportHeroSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../../sections/support/SupportHero.tsx"),
  "utf8"
);

const supportStickyRegionSource = readFileSync(
  join(
    dirname(fileURLToPath(import.meta.url)),
    "../../sections/support/SupportStickyRegion.tsx"
  ),
  "utf8"
);

const supportPageSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../../sections/support/SupportPage.tsx"),
  "utf8"
);

describe("support hero copy", () => {
  it("uses the current warranty title, label, and closing lines", () => {
    expect(supportContent.hero.title).toBe("Product Warranty");
    expect(supportContent.hero.label).toBe("BUILT TO LAST.");
    expect(supportContent.hero.body).toContain("長く使い続けるために。");
    expect(supportContent.hero.body).toContain(
      "初期不良に関する保証基準に基づき無償で対応します。"
    );
    expect(supportContent.hero.body).toContain("MADE FOR THE FIELD.");
    expect(supportContent.hero.body).not.toContain("Lifetime Warranty");
  });

  it("starts the title at the same 50svh items-end position as Concept", () => {
    expect(supportHeroSource).toContain("flex h-[50svh] w-full items-end");
    expect(supportHeroSource).toContain("conceptStoryTitleClassName");
    expect(supportHeroSource).not.toContain("quality-hero-title");
    expect(supportHeroSource).toContain("mt-[calc(32px*var(--gap-scale-y))]");
    expect(supportHeroSource).toContain("mt-[var(--section-title-gap)]");
    expect(supportHeroSource).not.toContain('className="h-[50svh]"');
    expect(supportHeroSource).not.toContain("pt-[50svh]");
    expect(supportHeroSource).not.toContain("flex h-svh flex-col items-center justify-center");
  });

  it("pins the background while the hero copy scrolls", () => {
    expect(supportHeroSource).toContain('data-support-hero-background');
    expect(supportHeroSource).toContain("sticky top-0 z-0 h-svh overflow-hidden");
    expect(supportHeroSource).toContain("-mt-[100svh]");
  });

  it("lets the next section cover the pinned hero from below without a footer gap", () => {
    expect(supportPageSource).toContain("<SupportStickyRegion>");
    expect(supportHeroSource).toContain("sticky top-0 z-0 h-svh overflow-hidden");
    expect(supportHeroSource).toContain("relative z-10 -mt-[100svh]");
    expect(supportStickyRegionSource).toContain("paddingBottom");
    expect(supportStickyRegionSource).toContain("marginBottom");
    expect(supportStickyRegionSource).toContain("[data-support-guide]");
    expect(supportStickyRegionSource).toContain("background?.offsetHeight");
  });

  it("pans the oversized background until the overlay reaches 100% black", () => {
    expect(supportHeroSource).toContain('"use client"');
    expect(supportHeroSource).toContain("subscribeMotionReady");
    expect(supportHeroSource).toContain("scroller: getScrollTriggerScroller()");
    expect(supportHeroSource).toContain("BACKGROUND_SCALE = 1.25");
    expect(supportHeroSource).toContain("`${BACKGROUND_SCALE * 100}%`");
    expect(supportHeroSource).toContain("object-cover object-top");
    expect(supportHeroSource).toContain("getPanDistance");
    expect(supportHeroSource).toContain("OVERLAY_END_OPACITY = 1");
    expect(supportHeroSource).toContain('data-support-hero-overlay');
    expect(supportHeroSource).toContain("scrub: true");
    expect(supportHeroSource).toContain('end: "bottom top"');
    expect(supportHeroSource).toContain('"(prefers-reduced-motion: reduce)"');
    expect(supportHeroSource).toContain("reducedMotion.matches");
    expect(supportHeroSource).not.toContain("OVERLAY_END_OPACITY = 0.7");
    expect(supportHeroSource).not.toContain('end: "bottom bottom"');
    expect(supportHeroSource).not.toContain("object-center");
  });

  it("uses half the body line-height between hero paragraphs", () => {
    expect(supportHeroSource).toContain('hero.body.split("\\n\\n")');
    expect(supportHeroSource).toContain("gap-y-[calc(15.75px*var(--text-scale))]");
    expect(supportContent.hero.body.split("\n\n")[0]).toBe("長く使い続けるために。");
  });
});
