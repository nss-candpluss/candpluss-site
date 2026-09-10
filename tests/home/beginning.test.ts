import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { topHeroContent } from "@/data/home";

const homeHeroSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../../sections/home/HomeHero.tsx"),
  "utf8"
);

const autoFitHeadingSource = readFileSync(
  join(
    dirname(fileURLToPath(import.meta.url)),
    "../../components/ui/AutoFitSingleLineHeading.tsx"
  ),
  "utf8"
);

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

  it("keeps enough hero scroll for the beginning title to reach mid-viewport", () => {
    expect(homeHeroSource).toContain("min-h-[50svh]");
    expect(homeHeroSource).toContain("-mt-[50px]");
    expect(homeHeroSource).toContain("pb-[var(--container-y-bottom)]");
  });

  it("centers the beginning copy", () => {
    expect(homeHeroSource).toContain("flex w-full flex-col items-center text-center text-white");
  });

  it("keeps the beginning copy above the pinned hero visual", () => {
    expect(homeHeroSource).toContain('data-home-hero-copy');
    expect(homeHeroSource).toContain("relative z-10");
  });

  it("uses Concept story body type and label-to-body gap", () => {
    expect(homeHeroSource).toContain("conceptStoryBodyClassName");
    expect(homeHeroSource).toContain("mt-[var(--section-title-gap)]");
    expect(homeHeroSource).not.toContain("bodyText(18)");
    expect(homeHeroSource).not.toContain("mt-[calc(98px*var(--gap-scale-y))]");
  });

  it("uses Concept English title size and container-y-bottom below READ MORE", () => {
    expect(homeHeroSource).toContain("conceptStoryTitleClassName");
    expect(homeHeroSource).not.toContain("sectionTitle67ClassName");
    expect(homeHeroSource).not.toContain("pb-[20vh]");
  });

  it("keeps the title on one line and fits it to the content area", () => {
    expect(homeHeroSource).toContain("data-home-beginning-title");
    expect(homeHeroSource).toContain("AutoFitSingleLineHeading");
    expect(autoFitHeadingSource).toContain("max-w-full whitespace-nowrap");
    expect(autoFitHeadingSource).toContain("const availableWidth = area.clientWidth");
    expect(autoFitHeadingSource).toContain("const naturalWidth = heading.scrollWidth");
    expect(autoFitHeadingSource).toContain("availableWidth / naturalWidth");
    expect(autoFitHeadingSource).toContain(
      'document.fonts.addEventListener("loadingdone", fitHeading)'
    );
  });
});
