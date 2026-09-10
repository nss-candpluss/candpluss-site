import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/site-metadata";
import { siteConfig } from "@/lib/site";

/** 検索対象にする固定ページ。confirm / cart / account / リダイレクトは含めない */
export const sitemapStaticPaths = [
  "/",
  "/products",
  "/concept",
  "/labo",
  "/news",
  "/support",
  "/contact",
  "/company",
  "/shopping-guide",
  "/legal/commercial-transactions",
  "/legal/terms",
  "/legal/privacy-policy",
  "/legal/cookie-policy",
] as const;

/** 公開後もクロールさせないパス */
export const robotsDisallowPaths = [
  "/cart",
  "/account",
  "/contact/confirm",
  "/contact/thanks",
  "/support/confirm",
  "/support/thanks",
  "/api/",
] as const;

export type SitemapEntry = {
  url: string;
  lastModified?: string;
};

export type SitemapArticle = {
  handle: string;
  publishedAt: string;
};

export function buildSitemapEntries({
  productHandles,
  articles,
}: {
  productHandles: readonly string[];
  articles: readonly SitemapArticle[];
}): SitemapEntry[] {
  return [
    ...sitemapStaticPaths.map((path) => ({
      url: absoluteUrl(path),
    })),
    ...productHandles.map((handle) => ({
      url: absoluteUrl(`/products/${handle}`),
    })),
    ...articles.map((article) => ({
      url: absoluteUrl(`/news/${article.handle}`),
      lastModified: article.publishedAt,
    })),
  ];
}

export function buildRobotsConfig(
  allowIndexing: boolean = siteConfig.allowSearchIndexing
): MetadataRoute.Robots {
  if (!allowIndexing) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [...robotsDisallowPaths],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: siteConfig.url,
  };
}
