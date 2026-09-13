import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  buildRobotsConfig,
  buildSitemapEntries,
  robotsDisallowPaths,
  sitemapStaticPaths,
} from "@/lib/sitemap";
import { siteConfig } from "@/lib/site";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../..");

/** app 配下の静的ルート（[handle] などの動的セグメントは除く） */
function collectStaticRoutes(dir = join(rootDir, "app"), route = ""): string[] {
  const routes = existsSync(join(dir, "page.tsx")) ? [route || "/"] : [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith("[")) {
      continue;
    }

    routes.push(
      ...collectStaticRoutes(join(dir, entry.name), `${route}/${entry.name}`)
    );
  }

  return routes;
}

const staticRoutes = collectStaticRoutes().sort();

/**
 * noindex はページ側 metadata か、`/cart` のように layout 側で指定される。
 * ルートの app/layout.tsx は allowSearchIndexing 次第で外れるため対象にしない。
 */
function hasNoindex(route: string): boolean {
  const segments = route === "/" ? [] : route.slice(1).split("/");
  const candidates = [join("app", ...segments, "page.tsx")];

  for (let depth = segments.length; depth > 0; depth -= 1) {
    candidates.push(join("app", ...segments.slice(0, depth), "layout.tsx"));
  }

  return candidates.some((file) => {
    const path = join(rootDir, file);

    return existsSync(path) && readFileSync(path, "utf8").includes("index: false");
  });
}

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

/**
 * ページを追加したときに sitemapStaticPaths への追記を忘れる事故を防ぐ。
 * /legal/licenses を追加したときに実際に漏れた。
 */
describe("sitemap の網羅性", () => {
  it("静的ルートを取得できている", () => {
    expect(staticRoutes).toContain("/");
    expect(staticRoutes).toContain("/legal/licenses");
    expect(staticRoutes.length).toBeGreaterThan(sitemapStaticPaths.length);
  });

  it("sitemap に無い静的ルートは noindex になっている", () => {
    const indexable = staticRoutes.filter(
      (route) =>
        !(sitemapStaticPaths as readonly string[]).includes(route) &&
        !hasNoindex(route)
    );

    expect(indexable).toEqual([]);
  });

  // 逆向きの矛盾。sitemap で申告しながら noindex を返すと Google に警告される
  it("sitemap のページは noindex になっていない", () => {
    const contradictory = sitemapStaticPaths.filter((route) =>
      hasNoindex(route)
    );

    expect(contradictory).toEqual([]);
  });

  // robots の Disallow と meta の noindex を二重で掛ける前提が崩れていないか
  it("Disallow 対象のページは noindex も返す", () => {
    const missing = robotsDisallowPaths
      .filter((path) => !path.endsWith("/"))
      .filter((path) => !hasNoindex(path));

    expect(missing).toEqual([]);
  });

  // 商品と News は Shopify / データ側の全件を渡す。絞り込むと sitemap が欠ける
  it("sitemap は商品と News の全件を渡している", () => {
    const source = readFileSync(join(rootDir, "app/sitemap.ts"), "utf8");

    expect(source).toContain("getListingProducts()");
    expect(source).toContain("newsArticleSource.getAllArticles()");
  });
});
