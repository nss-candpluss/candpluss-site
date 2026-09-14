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

    expect(visualsSource).toContain("OVERLAY_ALPHA = 1");
    expect(visualsSource).toContain("TITLE_OPACITY_END = 0.32");
    expect(visualsSource).toContain("titleStartY + (titleEndY - titleStartY) * progress");
    // desktop: -135 → -85 / mobile: -160 → -60
    expect(visualsSource).toContain("mobile: -160");
    expect(visualsSource).toContain("desktop: -135");
    expect(visualsSource).toContain("mobile: 100");
    expect(visualsSource).toContain("desktop: 50");
  });

  /**
   * CSS の scroll 駆動アニメーションは PC のみ有効な Lenis と同期が外れ、
   * Chrome で最上部でも黒が残ったまま復帰できなくなる。JS 制御に一本化した。
   */
  it("drives the hero fade from JavaScript only, never from a CSS scroll timeline", () => {
    const globalsCss = source("app/globals.css");
    const visualsSource = source("lib/heroScrollVisuals.ts");
    const heroSource = source("sections/home/HomeHero.tsx");

    expect(globalsCss).not.toContain("animation-timeline");
    expect(globalsCss).not.toContain("--hero-scroll-end");
    expect(globalsCss).not.toContain("hero-overlay-fade");
    expect(globalsCss).toContain(".hero-overlay {\n  background-color: rgba(0, 0, 0, 0);");

    expect(visualsSource).not.toContain("supportsHeroScrollCss");
    expect(heroSource).toContain('section.dataset.heroScrollMode = "js"');
  });

  /** 最上部なのにスナップショットの黒が残らないこと */
  it("ends a snapshot-restoring burst with a sync from the real scroll position", () => {
    const visualsSource = source("lib/heroScrollVisuals.ts");

    expect(visualsSource).toContain("if (allowSnapshot) {\n      syncFn(`${source}:settled`, false);");
  });
});
