import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  resolveScrollHeaderFadeAheadPx,
  resolveScrollHeaderVisibility,
} from "@/lib/header-scroll";

const headerSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../../components/layout/Header.tsx"),
  "utf8"
);
const cssSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../../app/globals.css"),
  "utf8"
);

describe("resolveScrollHeaderVisibility", () => {
  it("hides well before the page header enters the viewport", () => {
    expect(
      resolveScrollHeaderVisibility({
        originalHeaderBottom: -200,
        fadeAheadPx: resolveScrollHeaderFadeAheadPx(80),
        scrollY: 280,
        previousScrollY: 320,
        isCurrentlyVisible: true,
      })
    ).toBe(false);
  });

  it("keeps hiding once the page header is close to the viewport", () => {
    expect(
      resolveScrollHeaderVisibility({
        originalHeaderBottom: -40,
        fadeAheadPx: resolveScrollHeaderFadeAheadPx(80),
        scrollY: 120,
        previousScrollY: 160,
        isCurrentlyVisible: true,
      })
    ).toBe(false);
  });

  it("shows while scrolling up after the page header has left the screen", () => {
    expect(
      resolveScrollHeaderVisibility({
        originalHeaderBottom: -400,
        fadeAheadPx: 80,
        scrollY: 480,
        previousScrollY: 520,
        isCurrentlyVisible: false,
      })
    ).toBe(true);
  });

  it("hides while scrolling down", () => {
    expect(
      resolveScrollHeaderVisibility({
        originalHeaderBottom: -400,
        fadeAheadPx: 80,
        scrollY: 560,
        previousScrollY: 520,
        isCurrentlyVisible: true,
      })
    ).toBe(false);
  });

  it("ignores small scroll jitter", () => {
    expect(
      resolveScrollHeaderVisibility({
        originalHeaderBottom: -400,
        fadeAheadPx: 80,
        scrollY: 502,
        previousScrollY: 500,
        isCurrentlyVisible: true,
      })
    ).toBe(true);
  });
});

describe("scroll header fade-ahead", () => {
  it("starts hiding about three header heights before the page header appears", () => {
    expect(resolveScrollHeaderFadeAheadPx(80)).toBe(240);
    expect(resolveScrollHeaderFadeAheadPx(100)).toBe(300);
  });
});

describe("scroll header markup", () => {
  it("keeps the page header absolute and slides in a separate scroll header", () => {
    expect(headerSource).toContain("data-header-variant={variant}");
    expect(headerSource).toContain('variant="page"');
    expect(headerSource).toContain('variant="scroll"');
    expect(headerSource).toContain("absolute left-0 right-0 top-0");
    expect(headerSource).toContain("header-scroll");
    expect(headerSource).toContain("is-visible");
    expect(headerSource).toContain("resolveScrollHeaderFadeAheadPx");
    expect(cssSource).toContain("translate3d(0, -100%, 0)");
    expect(cssSource).toContain("transform 300ms ease");
    expect(cssSource).toContain("opacity 300ms ease");
  });
});
