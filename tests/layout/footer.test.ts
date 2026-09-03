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
    expect(footerSource).toContain('aria-label="Footer page links"');
    expect(footerSource).toContain('bg-[var(--color-divider)]');
    expect(footerSource.indexOf("Footer page links")).toBeLessThan(
      footerSource.indexOf("bg-[var(--color-divider)]")
    );
    expect(footerSource.indexOf("bg-[var(--color-divider)]")).toBeLessThan(
      footerSource.indexOf("Footer navigation")
    );
    expect(footerSource.indexOf("bg-[var(--color-divider)]")).toBeLessThan(
      footerSource.indexOf("Social media")
    );
    expect(footerSource.indexOf(footerContent.copyright)).toBeLessThan(
      footerSource.indexOf("Social media")
    );
    expect(footerSource).toContain("my-[48px]");
  });

  it("sizes PRODUCTS CONCEPT LABO SUPPORT between 14px and 16px", () => {
    expect(footerSource).toContain('uiTextRange("14-16")');
    expect(footerSource).toContain("navLinkClassName");
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
