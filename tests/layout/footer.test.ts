import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { footerContent } from "@/data/footer";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../..");
const footerSource = readFileSync(join(rootDir, "components/layout/Footer.tsx"), "utf8");
const mobileMenuSource = readFileSync(
  join(rootDir, "components/layout/HeaderMobileMenu.tsx"),
  "utf8"
);

describe("footer nav links", () => {
  it("lists PRODUCTS, CONCEPT, LABO, and SUPPORT before shopping guide links", () => {
    expect(footerContent.navLinks.map((link) => link.label)).toEqual([
      "PRODUCTS",
      "CONCEPT",
      "LABO",
      "SUPPORT",
    ]);
    expect(footerContent.primaryLinks[0]?.label).toBe("ショッピングガイド");
    expect(footerContent.logo.src).toBe("/assets/logos/logo-candpluss-tagline.svg");
  });

  it("separates page links from shopping guide links", () => {
    expect(footerSource).toContain("border-t border-[var(--color-divider)]");
    expect(footerSource).toContain('aria-label="Footer page links"');
    expect(footerSource).not.toContain('bg-[var(--color-divider)]');
    expect(footerSource).toContain("flex flex-col gap-6 px-[var(--container-x)] py-12 md:gap-8 md:py-16");
    expect(footerSource).not.toContain("gap-y-6 md:gap-y-12");
    expect(footerSource.indexOf("Footer page links")).toBeLessThan(
      footerSource.indexOf("Footer navigation")
    );
    expect(footerSource.indexOf("Footer navigation")).toBeLessThan(
      footerSource.indexOf("Social media")
    );
    expect(footerSource.indexOf(footerContent.copyright)).toBeLessThan(
      footerSource.indexOf("Social media")
    );
  });

  it("stacks page, shopping, and legal links in a column below 768px", () => {
    expect(footerSource).toContain(
      'aria-label="Footer page links"\n          className="flex flex-col gap-y-4 md:flex-row md:flex-wrap md:gap-x-[calc(32px*var(--gap-scale-x))]"'
    );
    expect(footerSource).toContain(
      'aria-label="Footer navigation"\n          className="flex flex-col gap-y-4 md:flex-row md:flex-wrap md:gap-x-[calc(32px*var(--gap-scale-x))]"'
    );
    expect(footerSource).toContain(
      'aria-label="Legal links"\n          className="flex flex-col gap-y-4 md:hidden"'
    );
  });

  it("sizes PRODUCTS CONCEPT LABO SUPPORT with uiText(16)", () => {
    expect(footerSource).toContain("uiText(16)");
    expect(footerSource).toContain("navLinkClassName");
  });

  it("uses underline hover on page links and opacity hover on shopping and legal links", () => {
    expect(footerSource).toContain(
      'const navLinkClassName = `${hoverUnderlineHoverClassName} font-ui-en ${uiText(16)} font-medium text-[var(--foreground)]`'
    );
    expect(footerSource).toContain(
      'const primaryLinkClassName = `font-body-ja ${uiText(14)} text-[var(--foreground)] transition-opacity duration-300 hover:opacity-60`'
    );
    expect(footerSource).toContain(
      'const legalLinkClassName = `font-body-ja ${uiText(13)} text-[var(--foreground)] transition-opacity duration-300 hover:opacity-60`'
    );
  });

  it("renders SNS icons at 28px", () => {
    expect(footerSource).toContain("size-[28px]");
  });

  it("places LINE immediately after Instagram", () => {
    const labels = footerContent.socialLinks.map((link) => link.label);
    const line = footerContent.socialLinks.find((link) => link.label === "LINE");

    expect(labels.indexOf("LINE")).toBe(labels.indexOf("Instagram") + 1);
    expect(line?.icon).toBe("/assets/icons/icon-sns-line.svg");
  });

  it("reuses footer social links in the hamburger menu", () => {
    expect(mobileMenuSource).toContain("footerContent.socialLinks");
  });
});
