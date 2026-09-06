import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { conceptContent } from "@/data/concept";
import {
  conceptTitleWrapClassName,
  splitConceptTitleWrapUnits,
} from "@/lib/concept-title";

const conceptPageSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../../sections/concept/ConceptPage.tsx"),
  "utf8"
);

const conceptSectionNavSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../../sections/concept/ConceptSectionNav.tsx"),
  "utf8"
);

const globalsCss = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../../app/globals.css"),
  "utf8"
);

const typographySource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../../lib/typography.ts"),
  "utf8"
);

describe("concept page copy", () => {
  it("has nine story sections with concept backgrounds except 04 and 05", () => {
    expect(conceptContent.sections.map((section) => section.title)).toEqual([
      "01｜Camp + Something",
      "02｜Our Origin",
      "03｜Our Philosophy",
      "04｜Material",
      "05｜Detail",
      "06｜Four Seasons",
      "07｜Field Tested",
      "08｜Our Answer",
      "09｜Ending",
    ]);
    expect(conceptContent.sections.map((section) => section.backgroundImage)).toEqual([
      "/images/concept/concept-01.webp",
      "/images/concept/concept-02.webp",
      "/images/concept/concept-03.webp",
      "/images/products/_shared/placeholder.webp",
      "/images/products/_shared/placeholder.webp",
      "/images/concept/concept-06.webp",
      "/images/concept/concept-07.webp",
      "/images/concept/concept-08.webp",
      "/images/concept/concept-09.webp",
    ]);
    expect(conceptContent.featureLinks.map((item) => item.title)).toEqual([
      "ALL PRODUCTS",
      "LABO",
      "SUPPORT",
    ]);
  });

  it("center-aligns the 01-09 story copy", () => {
    expect(conceptPageSource).toContain("text-center");
    expect(conceptPageSource).not.toContain("text-left");
  });

  it("uses ギア instead of 道具 in story body copy", () => {
    expect(conceptContent.sections.map((section) => section.body).join("\n")).not.toContain("道具");
    expect(conceptContent.sections[0]?.body).toContain("キャンプと大切なものをつなぐ。");
    expect(conceptContent.sections[0]?.body).toContain("ギアをつくること。");
    expect(conceptContent.sections[0]?.body).toContain(
      "それが「C AND+S」という名前に込めた想いです。"
    );
    expect(conceptContent.sections[0]?.body).toContain("WHAT’S YOUR + S ?");
    expect(conceptContent.sections[1]?.body).toContain("すべてはフィールドから始まった。");
    expect(conceptContent.sections[1]?.body).toContain(
      "「日本の厳しい四季に向き合い、そのすべてを楽しめるテントをつくれないだろうか」"
    );
    expect(conceptContent.sections[1]?.body).not.toContain(
      "「日本の厳しい四季に向き合い、そのすべてを楽しめるテントをつくれないだろうか。」"
    );
    expect(conceptContent.sections[2]?.body).toContain("美しさには理由がある。");
    expect(conceptContent.sections[3]?.body).toContain("素材に妥協しない。");
    expect(conceptContent.sections[4]?.body).toContain("小さなパーツにも理由がある。");
    expect(conceptContent.sections[5]?.body).toContain(
      "私たちはひとつの季節だけのためにギアをつくらない。"
    );
    expect(conceptContent.sections[6]?.body).toContain("答えはフィールドにある。");
    expect(conceptContent.sections[7]?.body).toContain(
      "ただのテントではなく「場所」なのかもしれない。"
    );
    expect(conceptContent.sections[7]?.body).toContain("テントをつくることのその先にあるもの。");
    expect(conceptContent.sections[8]?.body).toContain("より自由に楽しむためのギアをつくること。");
    expect(conceptContent.sections[8]?.body).toContain(
      "あなたにとってキャンプとつながる大切なものは何ですか。"
    );
    expect(conceptContent.sections[8]?.body).not.toContain("FIND YOUR SOUL.");
  });

  it("uses Support hero small-title spec for the English lead line", () => {
    expect(conceptContent.sections.map((section) => section.label)).toEqual([
      "CONNECTING TO WHAT MATTERS.",
      "IT STARTED IN THE FIELD.",
      "BEAUTY HAS A REASON.",
      "NO COMPROMISE IN MATERIALS.",
      "EVERY DETAIL MATTERS.",
      "DESIGNED FOR JAPAN.",
      "BUILT IN THE FIELD.",
      "MORE THAN A TENT.",
      "FIND YOUR SOUL. TOUCH THE GROUND.",
    ]);
    expect(conceptPageSource).toContain("section.label");
    expect(conceptPageSource).toContain("font-ui-en font-medium");
    expect(conceptPageSource).toContain("opacity-[0.65]");
    expect(conceptPageSource).toContain("uiText(18)");
    expect(conceptPageSource).toContain("mt-[calc(32px*var(--gap-scale-y))]");
    expect(conceptContent.sections[0]?.body.startsWith("キャンプと大切なものをつなぐ。")).toBe(
      true
    );
    expect(conceptContent.sections[1]?.body.startsWith("IT STARTED IN THE FIELD.")).toBe(
      false
    );
  });

  it("uses Support hero paragraph gaps for blank lines in story body", () => {
    expect(conceptPageSource).toContain('section.body.split("\\n\\n")');
    expect(conceptPageSource).toContain("gap-y-[calc(18px*var(--text-scale))]");
    expect(conceptContent.sections[0]?.body.split("\n\n")[3]).toBe(
      "ギアをつくること。\n空間をつくること。\nその先にある、時間や体験まで考えること。"
    );
    expect(conceptContent.sections[1]?.body.split("\n\n")[0]).toBe(
      "すべてはフィールドから始まった。"
    );
  });

  it("uses number and title for in-page nav labels", () => {
    expect(new Set(conceptContent.sections.map((section) => section.id)).size).toBe(9);
    expect(conceptSectionNavSource).toContain("{section.title}");
    expect(conceptSectionNavSource).not.toContain("getConceptSectionNavLabel");
  });

  it("renders a sticky in-page section nav", () => {
    expect(conceptPageSource).toContain("ConceptSectionNav");
    expect(conceptPageSource).toContain("id={section.id}");
  });

  it("uses a three-column desktop nav and centers story content on screen", () => {
    expect(conceptPageSource).toContain("SiteGrid");
    expect(conceptPageSource).toContain("conceptStoryHeadingSpanClassName");
    expect(conceptPageSource).toContain("conceptStoryContentSpanClassName");
    expect(conceptSectionNavSource).toContain("SiteGrid");
    expect(conceptSectionNavSource).toContain("conceptSectionNavSpanClassName");
    expect(conceptSectionNavSource).toContain("sticky top-0 flex h-svh items-center");
    expect(conceptSectionNavSource).toContain('uiTextRange("14-16")');
  });

  it("sets title numerals in Baskervville SC at the thinnest weight", () => {
    expect(conceptPageSource).toContain("concept-heading-numeral");
    expect(globalsCss).toContain("--concept-heading-numeral: var(--font-baskervville-sc)");
    expect(globalsCss).toMatch(/\.concept-heading-numeral \{[\s\S]*?font-weight: 400;/);
  });

  it("stacks the numeral and vertical rule above the English title", () => {
    expect(conceptPageSource).toContain("concept-heading-index");
    expect(conceptPageSource).toContain("title.slice(separatorIndex + 1)");
    expect(conceptPageSource).toContain("conceptStoryHeadingSpanClassName");
    expect(conceptPageSource).toContain('className={`block ${conceptStoryTitleClassName}');
    expect(conceptPageSource).toContain('aria-hidden="true"');
    expect(conceptPageSource).toContain("items-baseline");
    expect(conceptPageSource).toContain("top-[0.043em]");
    expect(conceptPageSource).toContain("h-[0.54em] w-px");
    expect(conceptPageSource).toContain("conceptHeadingNumeralClassName");
    expect(conceptPageSource).toContain("conceptStoryTitleClassName");
    expect(conceptPageSource).toContain("conceptHeadingEnglishGapClassName");
    expect(conceptPageSource).not.toContain("min-[1025px]:mt-0");
    expect(typographySource).toContain("leading-[0.48em]");
    expect(typographySource).toContain("-translate-y-[0.116em]");
  });

  it("marks every story for an accessible character reveal", () => {
    expect(conceptPageSource).toContain("animateIntro");
    expect(conceptPageSource).not.toContain("animateIntro={index === 0}");
    expect(conceptPageSource).toContain("aria-label={animateIntro ? indexLabel");
    expect(conceptPageSource).toContain("aria-label={animateIntro ? englishTitle");
    expect(conceptPageSource).toContain("data-concept-intro-title-character");
    expect(conceptPageSource).toContain("data-concept-intro-number-character");
    expect(conceptPageSource).toContain("data-concept-intro-rule");
    expect(conceptPageSource).toContain("data-concept-intro-label");
    expect(conceptPageSource).toContain("data-concept-intro-body");
    expect(conceptPageSource).toContain("data-concept-intro-black");
    expect(conceptPageSource).toContain('aria-hidden="true"');
    expect(conceptSectionNavSource).toContain("data-concept-intro-menu-item");
    expect(
      conceptPageSource.match(/transform: "translateY\(0\.6em\)"/g)
    ).toHaveLength(1);
  });

  it("wraps English titles by word and keeps plus groups together", () => {
    expect(splitConceptTitleWrapUnits("Camp + Something")).toEqual([
      "Camp +",
      "Something",
    ]);
    expect(splitConceptTitleWrapUnits("Our Origin")).toEqual([
      "Our",
      "Origin",
    ]);
    expect(splitConceptTitleWrapUnits("What’s Your + S ?")).toEqual([
      "What’s",
      "Your",
      "+ S ?",
    ]);
    expect(splitConceptTitleWrapUnits("Material")).toEqual(["Material"]);
    expect(conceptTitleWrapClassName).toContain("flex-wrap justify-center");
    expect(conceptTitleWrapClassName).toContain("gap-x-[0.3em]");
    expect(conceptTitleWrapClassName).toContain("gap-y-[0.15em]");
    expect(conceptPageSource).toContain("conceptTitleWrapClassName");
    expect(conceptPageSource).toContain("splitConceptTitleWrapUnits");
    expect(globalsCss).toContain('@source "../lib/concept-title.ts";');
  });

  it("starts the first English title at the vertical center of the viewport", () => {
    expect(conceptPageSource).toContain("flex h-[50svh] w-full items-end");
    expect(conceptPageSource).not.toContain('index === 0 ? "-translate-y-1/2"');
    expect(conceptPageSource).not.toContain("pt-[50svh]");
  });

  it("ends the story with a menu-free full-screen black outro title", () => {
    const storyRegionIndex = conceptPageSource.indexOf(
      "data-concept-story-region"
    );
    const menuIndex = conceptPageSource.indexOf(
      "<ConceptSectionNav sections={conceptContent.sections} />"
    );
    const outroIndex = conceptPageSource.lastIndexOf("data-concept-outro");

    expect(conceptContent.outroTitle).toBe("What’s Your + S ?");
    expect(conceptContent.outroLogo).toBe("/assets/logos/logo-candpluss-tagline.svg");
    expect(conceptPageSource).toContain("data-concept-outro-logo");
    expect(conceptPageSource).toContain("maskGraphicStyle(conceptContent.outroLogo)");
    expect(conceptPageSource).toContain("mt-[calc(72px*var(--gap-scale-y))]");
    expect(conceptPageSource).toContain(
      "h-[calc(48px*var(--text-scale))] w-[calc(195px*var(--text-scale))]"
    );
    expect(conceptPageSource).not.toContain("opacity-[0.12]");
    expect(conceptPageSource).not.toContain("-translate-x-1/2 -translate-y-1/2");
    expect(storyRegionIndex).toBeGreaterThan(-1);
    expect(menuIndex).toBeGreaterThan(storyRegionIndex);
    expect(outroIndex).toBeGreaterThan(menuIndex);
    expect(conceptPageSource).toContain("data-concept-outro");
    expect(conceptPageSource).toContain("data-concept-outro-title");
    expect(conceptPageSource).toContain("data-concept-outro-title-pin");
    expect(conceptPageSource).not.toContain(
      "data-concept-outro-title-character"
    );
    expect(conceptPageSource).toContain(
      'style={{ opacity: 0, transform: "translateY(96px)" }}'
    );
    expect(conceptPageSource).toContain("data-concept-outro-logo");
    expect(conceptPageSource).toContain(
      "...maskGraphicStyle(conceptContent.outroLogo)"
    );
    expect(conceptPageSource).not.toContain('transform: "translateY(32px)",');
    expect(conceptPageSource).toContain(
      'className="relative z-20 flex min-h-svh items-center bg-black"'
    );
    expect(conceptPageSource).toContain(
      "<ConceptOutroTitle title={conceptContent.outroTitle} />"
    );
    expect(conceptPageSource.indexOf("data-concept-outro")).toBeLessThan(
      conceptPageSource.indexOf("<ConceptFeatureLinks />")
    );
    expect(conceptSectionNavSource).not.toContain("outroTitle");
  });

  it("scales numeral size 32-48px and English top gap 12-18px", () => {
    expect(typographySource).toContain(
      "text-[clamp(32px,calc(32px+(100vw-375px)/(1440px-375px)*16px),48px)]"
    );
    expect(typographySource).toContain(
      "mt-[clamp(12px,calc(12px+(100vw-375px)/(1440px-375px)*6px),18px)]"
    );
  });

  it("scales only the Concept English title from 46px to 92px", () => {
    expect(typographySource).toContain(
      "text-[clamp(46px,calc(29.8px+4.32vw),92px)]"
    );
    expect(typographySource).toContain(
      "leading-[clamp(46px,calc(29.8px+4.32vw),92px)]"
    );
    expect(conceptPageSource).toContain("conceptStoryTitleClassName");
    expect(conceptPageSource).not.toContain("productDetailSectionTitleClassName");
  });

  it("uses a looser line-height only for Concept story body", () => {
    expect(conceptPageSource).toContain("conceptStoryBodyClassName");
    expect(conceptPageSource).not.toContain("bodyText(18)");
    expect(typographySource).toContain(
      "text-[calc(18px*var(--text-scale))] leading-[calc(36px*var(--text-scale))]"
    );
    expect(typographySource).toContain(
      "text-[calc(18px*var(--text-scale))] leading-[calc(31.5px*var(--text-scale))]"
    );
  });
});
