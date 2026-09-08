import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { conceptContent } from "@/data/concept";
import { contactPageContent } from "@/data/contact";
import { footerContent } from "@/data/footer";
import { homeFeatureLinks, homeMainProducts, topHeroContent } from "@/data/home";
import { laboVisitContent } from "@/data/labo";
import {
  globalNavigationLinks,
  headerIconLinks,
  mobilePrimaryNavigationLinks,
  mobileSecondaryNavigationLinks,
} from "@/data/navigation";
import { newsItems } from "@/data/news";
import { products } from "@/data/products";
import { supportContent } from "@/data/support";
import {
  isContactLinkVisible,
  isHeaderIconLinkVisible,
  isMembershipLinkVisible,
} from "@/lib/site-navigation-visibility";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../..");

const staticRoutes = new Set([
  "/",
  "/products",
  "/concept",
  "/labo",
  "/quality",
  "/support",
  "/news",
  "/cart",
  "/account",
  "/account/login",
  "/contact",
  "/contact/confirm",
  "/contact/thanks",
  "/company",
  "/shopping-guide",
  "/legal/commercial-transactions",
  "/legal/terms",
  "/legal/privacy-policy",
  "/legal/cookie-policy",
]);

const productHandles = new Set(products.map((product) => product.handle));
const newsHandles = new Set(newsItems.map((item) => item.handle));

/** 未確定のため現状維持。公開前に解消する。 */
const pendingInternalHrefs = new Set([
  "/products/moya420",
  "/search",
  "/documents/products/moya500/manual.pdf",
]);

function isResolvedInternalHref(href: string): boolean {
  if (pendingInternalHrefs.has(href)) {
    return true;
  }

  if (staticRoutes.has(href)) {
    return true;
  }

  const productMatch = href.match(/^\/products\/([^/#?]+)$/);
  if (productMatch) {
    return productHandles.has(productMatch[1] ?? "");
  }

  const newsMatch = href.match(/^\/news\/([^/#?]+)$/);
  if (newsMatch) {
    return newsHandles.has(newsMatch[1] ?? "");
  }

  if (href.startsWith("/documents/")) {
    return existsSync(join(rootDir, "public", href));
  }

  return false;
}

function collectHrefs(
  items: ReadonlyArray<{ href: string } | { link?: { href: string } }>
): string[] {
  return items.flatMap((item) => {
    if ("href" in item) {
      return [item.href];
    }

    return item.link ? [item.link.href] : [];
  });
}

describe("internal page links", () => {
  it("resolves visible header, footer, and page CTA links to existing routes", () => {
    const hrefs = [
      ...globalNavigationLinks
        .filter((link) => link.label !== "MEMBERSHIP" || isMembershipLinkVisible())
        .map((link) => link.href),
      ...mobilePrimaryNavigationLinks
        .filter((link) => link.label !== "MEMBERSHIP" || isMembershipLinkVisible())
        .map((link) => link.href),
      ...mobileSecondaryNavigationLinks
        .filter((link) => link.label !== "お問い合わせ" || isContactLinkVisible())
        .map((link) => link.href),
      ...headerIconLinks
        .filter((link) => isHeaderIconLinkVisible(link.label))
        .map((link) => link.href),
      footerContent.logo.href,
      ...footerContent.navLinks.map((link) => link.href),
      ...footerContent.primaryLinks
        .filter((link) => link.label !== "お問い合わせ" || isContactLinkVisible())
        .map((link) => link.href),
      ...footerContent.legalLinks.map((link) => link.href),
      topHeroContent.beginning.link.href,
      ...homeMainProducts.items.map((item) => item.href),
      homeMainProducts.link.href,
      ...homeFeatureLinks.map((item) => item.href),
      ...conceptContent.featureLinks.map((item) => item.href),
      laboVisitContent.contactButton.href,
      supportContent.guide.contactButton.href,
      contactPageContent.privacyPolicyHref,
      ...newsItems.flatMap((item) =>
        item.contentLink?.href.startsWith("/") ? [item.contentLink.href] : []
      ),
    ];

    const unresolved = [...new Set(hrefs)].filter(
      (href) => href.startsWith("/") && !isResolvedInternalHref(href)
    );

    expect(unresolved).toEqual([]);
  });

  it("keeps pending internal links listed until they are ready", () => {
    expect(collectHrefs(homeMainProducts.items)).toContain("/products/moya420");
    expect(productHandles.has("moya420")).toBe(false);
    expect(headerIconLinks.some((link) => link.href === "/search")).toBe(true);
    expect(existsSync(join(rootDir, "public/documents/products/moya500/manual.pdf"))).toBe(
      false
    );
  });
});
