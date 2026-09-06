import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

function source(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

describe("home overlap scroll", () => {
  it("pins the hero background while later sections cover it from below", () => {
    const pageSource = source("app/page.tsx");
    const heroSource = source("sections/home/HomeHero.tsx");
    const regionSource = source("sections/home/HomeStickyRegion.tsx");
    const visualsSource = source("lib/heroScrollVisuals.ts");
    const globalsCss = source("app/globals.css");

    expect(pageSource).toContain("<HomeStickyRegion>");
    expect(pageSource).toContain('data-home-covering');
    expect(pageSource).toContain("relative z-20");
    expect(pageSource).toContain("<HomeMainProducts />");
    expect(pageSource).toContain("<HomeLab />");

    expect(heroSource).toContain('data-home-hero-background');
    expect(heroSource).toContain("sticky top-0 z-0 h-screen overflow-hidden");
    expect(heroSource).toContain('data-home-hero-copy');
    expect(heroSource).toContain("relative z-10");
    expect(heroSource).toContain('data-home-hero-body');
    expect(heroSource).toContain('closest<HTMLElement>("[data-hero-section]")');
    expect(heroSource).not.toContain("data-hero-section\n");

    expect(regionSource).toContain('data-hero-section');
    expect(regionSource).toContain("paddingBottom");
    expect(regionSource).toContain("marginBottom");
    expect(regionSource).toContain("[data-home-covering]");
    expect(regionSource).toContain("background?.offsetHeight");

    expect(visualsSource).toContain("[data-home-hero-body]");
    expect(visualsSource).toContain("body.offsetHeight / 2");
    expect(globalsCss).toContain("body:has([data-home-hero-background]) footer");
  });

  it("darkens the hero overlay to 100% black on the same range as the title motion", () => {
    const visualsSource = source("lib/heroScrollVisuals.ts");
    const globalsCss = source("app/globals.css");

    expect(visualsSource).toContain("OVERLAY_ALPHA = 1");
    expect(visualsSource).toContain("titleStartY + (titleEndY - titleStartY) * progress");
    expect(globalsCss).toContain("background-color: rgba(0, 0, 0, 1);");
    expect(globalsCss).toContain("transform: translate3d(0, -85px, 0);");
    expect(globalsCss).toContain("transform: translate3d(0, -60px, 0);");
    expect(globalsCss).toContain(
      "[data-hero-section] .hero-overlay {\n    animation: hero-overlay-fade linear both;\n    animation-timeline: scroll(root block);\n    animation-range: 0 var(--hero-scroll-end);"
    );
    expect(globalsCss).toContain(
      "[data-hero-section] .hero-title-layer {\n    animation: hero-title-fade-desktop linear both;\n    animation-timeline: scroll(root block);\n    animation-range: 0 var(--hero-scroll-end);"
    );
  });
});
