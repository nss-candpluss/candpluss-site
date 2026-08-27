import { describe, expect, it } from "vitest";

import {
  fallbackHeaderTheme,
  headerThemeFromAttribute,
  headerThemeProbeY,
  isHeaderOnScreen,
  isProductDetailPath,
} from "@/lib/header-theme";

describe("isProductDetailPath", () => {
  it("matches a single product handle and ignores listing or nested paths", () => {
    expect(isProductDetailPath("/products/moya500")).toBe(true);
    expect(isProductDetailPath("/products/moya500-design")).toBe(true);
    expect(isProductDetailPath("/products")).toBe(false);
    expect(isProductDetailPath("/products/moya500/reviews")).toBe(false);
  });
});

describe("fallbackHeaderTheme", () => {
  it("uses onDark only for pages whose first screen is a dark hero", () => {
    expect(fallbackHeaderTheme("/")).toBe("onDark");
    expect(fallbackHeaderTheme("/concept")).toBe("onDark");
    expect(fallbackHeaderTheme("/labo")).toBe("onDark");
    expect(fallbackHeaderTheme("/support")).toBe("onDark");
  });

  it("uses onLight for listing, legal, and commerce pages", () => {
    expect(fallbackHeaderTheme("/products")).toBe("onLight");
    expect(fallbackHeaderTheme("/products/moya500")).toBe("onLight");
    expect(fallbackHeaderTheme("/news")).toBe("onLight");
    expect(fallbackHeaderTheme("/news/official-website-open")).toBe("onLight");
    expect(fallbackHeaderTheme("/contact")).toBe("onLight");
    expect(fallbackHeaderTheme("/cart")).toBe("onLight");
    expect(fallbackHeaderTheme("/company")).toBe("onLight");
    expect(fallbackHeaderTheme("/shopping-guide")).toBe("onLight");
    expect(fallbackHeaderTheme("/legal/privacy-policy")).toBe("onLight");
    expect(fallbackHeaderTheme("/account/login")).toBe("onLight");
  });
});

describe("headerThemeFromAttribute", () => {
  it("prefers the probed section attribute and falls back by path when missing", () => {
    expect(headerThemeFromAttribute("onLight", "/")).toBe("onLight");
    expect(headerThemeFromAttribute("onDark", "/products")).toBe("onDark");
    expect(headerThemeFromAttribute(null, "/products")).toBe("onLight");
    expect(headerThemeFromAttribute(undefined, "/")).toBe("onDark");
  });
});

describe("isHeaderOnScreen", () => {
  it("skips updates while the absolute header is fully above the viewport", () => {
    expect(isHeaderOnScreen(-1800, -1730, 812)).toBe(false);
    expect(isHeaderOnScreen(0, 70, 812)).toBe(true);
  });
});

describe("headerThemeProbeY", () => {
  it("clamps the probe to the visible viewport", () => {
    expect(headerThemeProbeY(0, 812)).toBe(40);
    expect(headerThemeProbeY(-80, 812)).toBe(0);
  });
});
