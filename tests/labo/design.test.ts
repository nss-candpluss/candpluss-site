import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { laboDesignContent } from "@/data/labo";

const laboDesignSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../../sections/labo/LaboDesign.tsx"),
  "utf8"
);

describe("labo design section", () => {
  it("uses the design and development copy", () => {
    expect(laboDesignContent.number).toBe("03.");
    expect(laboDesignContent.title).toBe("LABOではデザイン・開発を行っています");
    expect(laboDesignContent.titleLead).toBe("LABOでは");
    expect(laboDesignContent.titleWrapSegments).toEqual([
      "デザイン・開発を",
      "行っています",
    ]);
    expect(laboDesignContent.label).toBe("DESIGN & DEVELOPMENT");
    expect(laboDesignContent.body).toContain("製品を生み出す拠点でもあります");
    expect(laboDesignContent.image).toBe("/images/labo/labo-skech-image.webp");
  });

  it("uses a single left-aligned text column over a right-aligned background image", () => {
    expect(laboDesignSource).toContain('"use client"');
    expect(laboDesignSource).toContain('data-header-theme="onDark"');
    expect(laboDesignSource).toContain("bg-black");
    expect(laboDesignSource).toContain("pt-[var(--container-y-top)]");
    expect(laboDesignSource).toContain(
      "pb-[clamp(82px,calc(82px+(100vw-390px)/(1920px-390px)*102px),184px)]"
    );
    expect(laboDesignSource).not.toContain("pb-[var(--container-y-bottom)]");
    expect(laboDesignSource).toContain("absolute inset-y-0 left-0");
    expect(laboDesignSource).toContain("min-[1025px]:left-auto");
    expect(laboDesignSource).toContain("min-[1025px]:right-0");
    expect(laboDesignSource).toContain("aspect-[3/2]");
    expect(laboDesignSource).toContain("object-left");
    expect(laboDesignSource).toContain("min-[1025px]:object-right");
    expect(laboDesignSource).toContain("overflow-hidden");
    expect(laboDesignSource).toContain(
      "data-labo-design-background-image"
    );
    expect(laboDesignSource).toContain("min-[1025px]:max-w-[720px]");
    expect(laboDesignSource).not.toContain("min-[1025px]:grid-cols-2");
    expect(laboDesignSource).not.toContain("aspect-[13/10]");
    expect(laboDesignSource).toContain("uiText(48)");
    expect(laboDesignSource).toContain("titleLead");
    expect(laboDesignSource).toContain("titleWrapSegments");
    expect(laboDesignSource).toContain("flex-col");
    expect(laboDesignSource).toContain("flex-wrap");
    expect(laboDesignSource).toContain("gap-y-[0.2em]");
    expect(laboDesignSource).toContain("whitespace-nowrap");
    expect(laboDesignSource).toContain("concept-heading-numeral");
    expect(laboDesignSource).toContain(
      "mb-[clamp(16px,calc(20px*var(--gap-scale-y)),20px)]"
    );
    expect(laboDesignSource).toContain("uiText(18)");
    expect(laboDesignSource).toContain(
      "mt-[clamp(10px,calc(16px*var(--gap-scale-y)),16px)]"
    );
    expect(laboDesignSource).toContain("bodyText(16)");
    expect(laboDesignSource).toContain(
      "mt-[clamp(38px,calc(72px*var(--gap-scale-y)),72px)]"
    );
    expect(laboDesignSource).not.toContain("sectionTitle62ClassName");
    expect(laboDesignSource).not.toContain(
      "mt-[calc(32px*var(--gap-scale-y))]"
    );
    expect(laboDesignSource).not.toContain(
      "mt-[calc(42px*var(--gap-scale-y))]"
    );
  });

  it("scales only the background image by ten percent on scroll", () => {
    expect(laboDesignSource).toContain("BACKGROUND_END_SCALE = 1.1");
    expect(laboDesignSource).toContain("subscribeMotionReady");
    expect(laboDesignSource).toContain("getScrollTriggerScroller");
    expect(laboDesignSource).toContain("scale: BACKGROUND_END_SCALE");
    expect(laboDesignSource).toContain('transformOrigin: "center center"');
    expect(laboDesignSource).toContain('start: "top bottom"');
    expect(laboDesignSource).toContain('end: "bottom top"');
    expect(laboDesignSource).toContain("scrub: true");
    expect(laboDesignSource).toContain(
      '"(prefers-reduced-motion: reduce)"'
    );
    expect(laboDesignSource).toContain("reducedMotion.matches");
  });
});
