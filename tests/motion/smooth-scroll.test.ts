import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, it, vi } from "vitest";

import { SMOOTH_SCROLL } from "@/lib/motion/smooth-scroll-config";
import { shouldEnableSmoothScroll } from "@/lib/motion/should-enable-smooth-scroll";

const testDirectory = dirname(fileURLToPath(import.meta.url));
const providerSource = readFileSync(
  join(testDirectory, "../../components/motion/SmoothScrollProvider.tsx"),
  "utf8"
);
const integrationSource = readFileSync(
  join(testDirectory, "../../lib/motion/setup-lenis-scroll-trigger.ts"),
  "utf8"
);
const conceptNavSource = readFileSync(
  join(testDirectory, "../../sections/concept/ConceptSectionNav.tsx"),
  "utf8"
);
const contactScrollSource = readFileSync(
  join(testDirectory, "../../lib/contact/scroll-to-error.ts"),
  "utf8"
);
const supportContactScrollSource = readFileSync(
  join(testDirectory, "../../lib/support-contact/scroll-to-error.ts"),
  "utf8"
);

function stubBrowser({ touchPoints = 0 }: { touchPoints?: number } = {}) {
  vi.stubGlobal("navigator", { maxTouchPoints: touchPoints });
  vi.stubGlobal("window", {
    matchMedia: vi.fn((query: string) => ({
      matches: query === "(pointer: fine) and (min-width: 768px)",
    })),
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("site-wide smooth scroll", () => {
  it("uses the requested Lenis options across the site", () => {
    expect(SMOOTH_SCROLL).toMatchObject({
      enabled: true,
      desktopOnly: true,
      options: {
        lerp: 0.08,
        wheelMultiplier: 1,
        smoothWheel: true,
        syncTouch: false,
        anchors: true,
        autoRaf: true,
      },
    });

    stubBrowser();
    expect(shouldEnableSmoothScroll()).toBe(true);
  });

  it("keeps Lenis disabled on touch devices", () => {
    stubBrowser({ touchPoints: 1 });
    expect(shouldEnableSmoothScroll()).toBe(false);
  });

  it("avoids duplicate RAF and native smooth-anchor handling", () => {
    expect(providerSource).toContain("new Lenis(SMOOTH_SCROLL.options)");
    expect(providerSource).not.toContain("usePathname");
    expect(integrationSource).not.toContain("lenis.raf(");
    expect(integrationSource).not.toContain("gsap.ticker");
    expect(conceptNavSource).toContain("isLenisBound()");
    expect(conceptNavSource).not.toContain("scrollIntoView");
    expect(contactScrollSource).toContain("scrollBoundLenisTo(element)");
    expect(contactScrollSource).toContain(
      'element.scrollIntoView({ behavior: "smooth", block: "start" })'
    );
    expect(supportContactScrollSource).toContain("scrollBoundLenisTo(element)");
    expect(supportContactScrollSource).toContain(
      'element.scrollIntoView({ behavior: "smooth", block: "start" })'
    );
  });

  it("settles Lenis momentum before a navigation starts", () => {
    // 慣性中（isScrolling === "smooth"）の Lenis はネイティブ scroll を無視するため、
    // Next.js の scrollTop = 0 が次フレームで上書きされ遷移先でページ途中に着地する。
    // 遷移が始まる前に慣性を打ち切ることで回避している。
    expect(providerSource).toContain("settleBoundLenis()");
    expect(providerSource).toContain(
      'document.addEventListener("pointerdown", onNavigationPointerDown, true)'
    );
    expect(providerSource).toMatch(
      /document\.removeEventListener\(\s*"pointerdown"/
    );
    // router.push を使うボタン経由の遷移も対象にする
    expect(providerSource).toContain("a[href], button, [role='button']");
  });

  it("keeps the cart scroll lock intact while settling momentum", () => {
    // CartDialog が stopBoundLenis() でロック中は isScrolling === false になる。
    // ガードがないと stop()/start() でロックを解除してしまう。
    expect(integrationSource).toContain('boundLenis.isScrolling !== "smooth"');
  });
});
