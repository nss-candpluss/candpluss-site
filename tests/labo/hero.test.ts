import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { laboContent } from "@/data/labo";
import { baskervvilleCapHeightEm } from "@/lib/typography";

const laboHeroSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../../sections/labo/LaboHero.tsx"),
  "utf8"
);

const laboPageSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../../sections/labo/LaboPage.tsx"),
  "utf8"
);

describe("labo hero copy", () => {
  it("uses the labo logo, subtitle, and experience-space body", () => {
    expect(laboContent.hero.title).toBe("C AND+S LABO");
    expect(laboContent.hero.titleLogo).toBe("/assets/logos/logo-candpluss-labo.svg");
    expect(laboContent.hero.label).toBe("SEE. TOUCH. EXPERIENCE.");
    expect(laboContent.hero.body).toBe(
      "C AND+S LABOは、製品を実際に見て、触れて、\nその品質やサイズ感を確かめていただける\nブランド体験スペースです。"
    );
    expect(laboContent.hero.title).not.toBe("Built for Better.");
    expect(laboContent.hero.label).not.toBe("LABO");
  });

  it("matches Support hero copy position and type sizes", () => {
    expect(laboHeroSource).toContain("flex h-[50svh] w-full items-end");
    expect(laboHeroSource).toContain("conceptStoryTitleClassName");
    expect(baskervvilleCapHeightEm).toBe(0.71);
    expect(laboHeroSource).toContain(
      `w-[min(100%,calc(${baskervvilleCapHeightEm}em*814.088/72.001))]`
    );
    expect(laboHeroSource).toContain("max-w-[1050px]");
    expect(laboHeroSource).toContain("mt-[calc(32px*var(--gap-scale-y))]");
    expect(laboHeroSource).toContain("mt-[var(--section-title-gap)]");
    expect(laboHeroSource).toContain("uiText(18)");
    expect(laboHeroSource).toContain("opacity-[0.65]");
    expect(laboHeroSource).toContain("bodyText(18)");
    expect(laboHeroSource).toContain('hero.body.split("\\n\\n")');
    expect(laboHeroSource).not.toContain("quality-hero-title");
    expect(laboHeroSource).not.toContain("flex h-full items-center");
  });

  it("pins and pans the background while keeping the title positioned by svh", () => {
    expect(laboHeroSource).toContain("hero.titleLogo");
    expect(laboHeroSource).toContain("brightness-0 invert");
    expect(laboHeroSource).toContain('"use client"');
    expect(laboHeroSource).toContain("data-labo-hero-background");
    expect(laboHeroSource).toContain("sticky top-0 z-0 h-lvh overflow-hidden");
    expect(laboHeroSource).toContain("-mt-[100lvh]");
    expect(laboHeroSource).toContain("min-h-lvh");
    expect(laboHeroSource).toContain("flex h-[50svh] w-full items-end");
    expect(laboHeroSource).toContain("subscribeMotionReady");
    expect(laboHeroSource).toContain("getScrollTriggerScroller");
    expect(laboHeroSource).toContain("BACKGROUND_SCALE = 1.25");
    expect(laboHeroSource).toContain("getPanDistance");
    expect(laboHeroSource).toContain("data-labo-hero-overlay");
    expect(laboHeroSource).toContain("OVERLAY_END_OPACITY = 1");
    expect(laboHeroSource).toContain("scrub: true");
    expect(laboHeroSource).toContain('end: "bottom top"');
    expect(laboHeroSource).toContain('"(prefers-reduced-motion: reduce)"');
    expect(laboHeroSource).toContain("reducedMotion.matches");
  });

  it("lets the LABO content cover the sticky hero", () => {
    expect(laboPageSource).toContain("data-labo-content");
    expect(laboPageSource).toContain('className="relative z-20"');
    expect(laboPageSource.indexOf("<LaboHero />")).toBeLessThan(
      laboPageSource.indexOf("data-labo-content")
    );
    expect(laboPageSource.indexOf("data-labo-content")).toBeLessThan(
      laboPageSource.indexOf("<LaboAbout />")
    );
  });
});
