import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { hrefPathname, isSamePageHref, isUnmodifiedPrimaryClick } from "@/lib/same-page-href";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../..");

function readSource(relativePath: string) {
  return readFileSync(join(rootDir, relativePath), "utf8");
}

describe("isSamePageHref", () => {
  it("matches the current page and ignores product-detail prefixes", () => {
    expect(isSamePageHref("/products", "/products")).toBe(true);
    expect(isSamePageHref("/products/", "/products")).toBe(true);
    expect(isSamePageHref("/products", "/products#top")).toBe(true);
    expect(isSamePageHref("/products/moya500", "/products")).toBe(false);
    expect(isSamePageHref("/concept", "/labo")).toBe(false);
  });

  it("strips query and hash from hrefs", () => {
    expect(hrefPathname("/company?from=footer")).toBe("/company");
    expect(hrefPathname("/legal/terms#section")).toBe("/legal/terms");
  });
});

describe("isUnmodifiedPrimaryClick", () => {
  it("ignores modified clicks so new-tab navigation still works", () => {
    const unmodified = {
      button: 0,
      metaKey: false,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
    };

    expect(isUnmodifiedPrimaryClick(unmodified)).toBe(true);
    expect(isUnmodifiedPrimaryClick({ ...unmodified, metaKey: true })).toBe(false);
  });
});

describe("site chrome uses SiteNavLink", () => {
  it("applies same-page top scroll to header, footer, and hamburger links", () => {
    const siteNavLinkSource = readSource("components/layout/SiteNavLink.tsx");
    const scrollSource = readSource("lib/scroll-to-page-top.ts");

    expect(siteNavLinkSource).toContain("isSamePageHref(pathname, href)");
    expect(siteNavLinkSource).toContain("scrollToPageTop()");
    expect(scrollSource).toContain("scrollBoundLenisTo(0)");
    expect(scrollSource).toContain('window.scrollTo({ top: 0, behavior: "smooth" })');
    expect(readSource("components/layout/Header.tsx")).toContain("SiteNavLink");
    expect(readSource("components/layout/Footer.tsx")).toContain("SiteNavLink");
    expect(readSource("components/layout/HeaderMobileMenu.tsx")).toContain("SiteNavLink");
  });
});
