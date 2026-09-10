import { describe, expect, it } from "vitest";

import {
  buildRobotsConfig,
  buildSitemapEntries,
  robotsDisallowPaths,
  sitemapStaticPaths,
} from "@/lib/sitemap";
import { siteConfig } from "@/lib/site";

describe("sitemap and robots", () => {
  it("lists public static pages with absolute production URLs", () => {
    const entries = buildSitemapEntries({
      productHandles: ["moya500"],
      articles: [
        { handle: "official-website-open", publishedAt: "2026-07-08" },
      ],
    });
    const urls = entries.map((entry) => entry.url);

    expect(sitemapStaticPaths).toContain("/");
    expect(sitemapStaticPaths).toContain("/concept");
    expect(sitemapStaticPaths).not.toContain("/cart");
    expect(sitemapStaticPaths).not.toContain("/account");
    expect(sitemapStaticPaths).not.toContain("/quality");
    expect(urls).toContain("https://candpluss.camp/");
    expect(urls).toContain("https://candpluss.camp/products/moya500");
    expect(urls).toContain(
      "https://candpluss.camp/news/official-website-open"
    );
    expect(
      entries.find(
        (entry) =>
          entry.url === "https://candpluss.camp/news/official-website-open"
      )?.lastModified
    ).toBe("2026-07-08");
    expect(urls.some((url) => url.includes("/cart"))).toBe(false);
  });

  it("keeps crawlers out before launch and advertises the sitemap after", () => {
    const closed = buildRobotsConfig(false);
    const open = buildRobotsConfig(true);

    expect(closed).toEqual({
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    });
    expect(open.sitemap).toBe("https://candpluss.camp/sitemap.xml");
    expect(open.host).toBe(siteConfig.url);

    const openRules = Array.isArray(open.rules) ? open.rules[0] : open.rules;

    expect(openRules).toMatchObject({
      userAgent: "*",
      allow: "/",
    });
    expect(openRules?.disallow).toEqual([...robotsDisallowPaths]);
    expect(openRules?.disallow).toContain("/cart");
    expect(openRules?.disallow).toContain("/account");
    expect(openRules?.disallow).toContain("/api/");
  });
});
