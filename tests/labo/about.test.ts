import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { laboAboutContent } from "@/data/labo";

const laboAboutSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../../sections/labo/LaboAbout.tsx"),
  "utf8"
);

const laboAboutGallerySource = readFileSync(
  join(
    dirname(fileURLToPath(import.meta.url)),
    "../../sections/labo/LaboAboutGallery.tsx"
  ),
  "utf8"
);

const laboPageSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../../sections/labo/LaboPage.tsx"),
  "utf8"
);

describe("labo about section", () => {
  it("uses the about copy and a single dummy image", () => {
    expect(laboAboutContent.number).toBe("01.");
    expect(laboAboutContent.title).toBe("LABOについて");
    expect(laboAboutContent.titleWrapSegments).toEqual(["LABOに", "ついて"]);
    expect(laboAboutContent.label).toBe("ABOUT C AND+S LABO");
    expect(laboAboutContent.bodyTitle).toBe("製品をもっと深く知るための場所");
    expect(laboAboutContent.body).toContain(
      "MOYAシリーズの製品展示をはじめ、ZIG STAKEなど"
    );
    expect(laboAboutContent.image.src).toBe(
      "/images/labo/labo-materials-01.webp"
    );
    expect(laboAboutContent.bodyImage.src).toBe(
      "/images/labo/labo-materials-01.webp"
    );
  });

  it("follows the former HomeSupport two-column layout", () => {
    expect(laboAboutSource).toContain("min-[1025px]:grid-cols-2");
    expect(laboAboutSource).toContain("aspect-[3/4]");
    expect(laboAboutSource).toContain("min-[1025px]:self-start");
    expect(laboAboutSource).toContain("min-[1025px]:w-[80%]");
    expect(laboAboutSource).toContain(
      "min-[1025px]:ml-[calc((var(--container-x)+20%-calc(52px*var(--gap-scale-x)))/2)]"
    );
    expect(laboAboutSource).toContain("aspect-[13/10]");
    expect(laboAboutSource).toContain("min-[1025px]:row-span-3");
    expect(laboAboutSource).toContain("uiText(48)");
    expect(laboAboutSource).toContain("concept-heading-numeral");
    expect(laboAboutSource).toContain(
      "mb-[clamp(16px,calc(20px*var(--gap-scale-y)),20px)]"
    );
    expect(laboAboutSource).toContain("uiText(18)");
    expect(laboAboutSource).toContain(
      "mt-[clamp(10px,calc(16px*var(--gap-scale-y)),16px)] font-ui-en"
    );
    expect(laboAboutSource).toContain("uiText(21)");
    expect(laboAboutSource).toContain(
      "mt-[clamp(38px,calc(72px*var(--gap-scale-y)),72px)]"
    );
    expect(laboAboutSource).toContain(
      "min-[1025px]:mt-[clamp(38px,calc(148px*var(--gap-scale-y)),148px)]"
    );
    expect(laboAboutSource).toContain(
      "mt-[clamp(38px,calc(102px*var(--gap-scale-y)),102px)]"
    );
    expect(laboAboutSource).toContain("bodyText(16)");
    expect(laboAboutSource).toContain(
      "mt-[clamp(18px,calc(32px*var(--gap-scale-y)),32px)]"
    );
    expect(laboAboutSource).toContain("<LaboAboutGallery");
    expect(laboAboutSource).toContain("{bodyImage.src}");
    expect(laboAboutSource).toContain("contents");
    expect(laboAboutSource).toContain("min-[1025px]:block");
    expect(laboAboutSource).toContain('className={`order-2');
    expect(laboAboutSource).toContain("order-3 mt-[clamp(18px,calc(32px*var(--gap-scale-y)),32px)]");
    expect(laboAboutSource).toContain("order-4 mt-[calc(98px*var(--layout-scale-y))]");
    expect(laboAboutSource).toContain("order-5 mt-[clamp(38px,calc(102px*var(--gap-scale-y)),102px)]");
    expect(laboAboutSource).not.toContain("ml-[25px]");
    expect(laboAboutSource).not.toContain("mr-[35px]");
    expect(laboAboutSource).toContain("titleWrapSegments");
    expect(laboAboutSource).toContain("gap-y-[0.2em]");
    expect(laboAboutSource).toContain("whitespace-nowrap");
    expect(laboAboutSource.indexOf("{number}\n")).toBeLessThan(
      laboAboutSource.indexOf("titleWrapSegments.map")
    );
    expect(laboAboutSource.indexOf("titleWrapSegments.map")).toBeLessThan(
      laboAboutSource.indexOf("{label}\n")
    );
    expect(laboAboutSource.indexOf("{label}\n")).toBeLessThan(
      laboAboutSource.indexOf("{bodyTitle}\n")
    );
    expect(laboAboutSource.indexOf("{bodyTitle}\n")).toBeLessThan(
      laboAboutSource.indexOf("{body}\n")
    );
  });

  it("places the about block under the hero and drops Materials/Design scroll", () => {
    expect(laboPageSource).toContain("<LaboHero />");
    expect(laboPageSource).toContain("<LaboAbout />");
    expect(laboPageSource).toContain("<LaboActivities />");
    expect(laboPageSource).toContain("<LaboDesign />");
    expect(laboPageSource).toContain("<LaboVisit />");
    expect(laboPageSource).toContain("<LaboAccess />");
    expect(laboPageSource).not.toContain("LaboFeatureLinks");
    expect(laboPageSource).not.toContain("LaboScrollSection");
    expect(laboPageSource).not.toContain("LaboPageViewport");
  });

  it("renders the about image without slide controls", () => {
    expect(laboAboutGallerySource).not.toContain("ProductGalleryControls");
    expect(laboAboutGallerySource).not.toContain('"use client"');
    expect(laboAboutGallerySource).toContain("<SiteImage");
    expect(laboAboutGallerySource).toContain("data-labo-about-gallery");
  });

  it("moves only the right gallery upward on desktop scroll", () => {
    expect(laboAboutSource).toContain('"use client"');
    expect(laboAboutSource).toContain('DESKTOP_QUERY = "(min-width: 1025px)"');
    expect(laboAboutSource).toContain("GALLERY_START_Y_PERCENT = 30");
    expect(laboAboutSource).toContain("GALLERY_END_Y_PERCENT = 0");
    expect(laboAboutSource).toContain('"[data-labo-about-gallery]"');
    expect(laboAboutSource).toContain("subscribeMotionReady");
    expect(laboAboutSource).toContain("getScrollTriggerScroller");
    expect(laboAboutSource).toContain("!desktop.matches");
    expect(laboAboutSource).toContain("reducedMotion.matches");
    expect(laboAboutSource).toContain(
      "{ yPercent: GALLERY_START_Y_PERCENT }"
    );
    expect(laboAboutSource).toContain("yPercent: GALLERY_END_Y_PERCENT");
    expect(laboAboutSource).toContain('start: "top bottom"');
    expect(laboAboutSource).toContain('end: "bottom top"');
    expect(laboAboutSource).toContain("scrub: true");
  });
});
