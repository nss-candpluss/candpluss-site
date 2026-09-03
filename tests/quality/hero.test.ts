import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { qualityContent } from "@/data/quality";

const qualityHeroSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../../sections/quality/QualityHero.tsx"),
  "utf8"
);

describe("quality / labo hero copy", () => {
  it("uses the labo logo, subtitle, and experience-space body", () => {
    expect(qualityContent.hero.title).toBe("C AND+S LABO");
    expect(qualityContent.hero.titleLogo).toBe("/assets/logos/logo-candpluss-labo.svg");
    expect(qualityContent.hero.label).toBe("SEE. TOUCH. EXPERIENCE.");
    expect(qualityContent.hero.body).toBe(
      "C AND+S LABOは、製品を実際に見て、触れて、\nその品質やサイズ感を確かめていただける\nブランド体験スペースです。"
    );
    expect(qualityContent.hero.title).not.toBe("Built for Better.");
    expect(qualityContent.hero.label).not.toBe("LABO");
  });

  it("matches Support hero copy position and type sizes", () => {
    expect(qualityHeroSource).toContain("flex h-[50svh] w-full items-end");
    expect(qualityHeroSource).toContain("conceptStoryTitleClassName");
    expect(qualityHeroSource).toContain("w-[min(100%,calc(1em*814.088/72.001))]");
    expect(qualityHeroSource).toContain("max-w-[1050px]");
    expect(qualityHeroSource).toContain("mt-[calc(32px*var(--gap-scale-y))]");
    expect(qualityHeroSource).toContain("mt-[var(--section-title-gap)]");
    expect(qualityHeroSource).toContain("uiText(21)");
    expect(qualityHeroSource).toContain("bodyText(18)");
    expect(qualityHeroSource).toContain('hero.body.split("\\n\\n")');
    expect(qualityHeroSource).not.toContain("quality-hero-title");
    expect(qualityHeroSource).not.toContain("flex h-full items-center");
  });

  it("renders the title as the labo logo svg without background motion", () => {
    expect(qualityHeroSource).toContain("hero.titleLogo");
    expect(qualityHeroSource).toContain("brightness-0 invert");
    expect(qualityHeroSource).not.toContain("subscribeMotionReady");
    expect(qualityHeroSource).not.toContain("ScrollTrigger");
    expect(qualityHeroSource).not.toContain("BACKGROUND_SCALE");
    expect(qualityHeroSource).not.toContain("sticky top-0");
  });
});
