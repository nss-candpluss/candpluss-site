import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { createPageMetadata } from "@/lib/site-metadata";
import { siteConfig } from "@/lib/site";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../..");

function readSource(relativePath: string) {
  return readFileSync(join(rootDir, relativePath), "utf8");
}

describe("site metadata foundation", () => {
  it("uses the production origin as the metadata base", () => {
    expect(siteConfig.url).toBe("https://candpluss.camp");
    expect(siteConfig.ogImage).toBe("/images/common/og-default.jpg");
    expect(siteConfig.ogImageWidth).toBe(1200);
    expect(siteConfig.ogImageHeight).toBe(630);

    const layoutSource = readSource("app/layout.tsx");

    expect(layoutSource).toContain("metadataBase: new URL(siteConfig.url)");
    expect(layoutSource).toContain("default: siteConfig.name");
    expect(layoutSource).toContain("template: `%s | ${siteConfig.name}`");
  });

  it("共通 OG 画像が public に実在し、OG 推奨比 1.91:1 に収まっている", () => {
    const filePath = join(rootDir, "public", siteConfig.ogImage);

    expect(existsSync(filePath)).toBe(true);

    // クローラー互換のため WebP は使わない
    expect(siteConfig.ogImage.endsWith(".jpg")).toBe(true);

    const ratio = siteConfig.ogImageWidth / siteConfig.ogImageHeight;
    expect(ratio).toBeGreaterThan(1.85);
    expect(ratio).toBeLessThan(2);

    // 取得に時間がかかるとサムネイルが出ないクローラーがあるため 500KB 未満に保つ
    expect(statSync(filePath).size).toBeLessThan(500 * 1024);
  });

  it("keeps page titles suffix-free so the root template can append the site name", () => {
    const pageSources = [
      "app/concept/page.tsx",
      "app/labo/page.tsx",
      "app/support/page.tsx",
      "app/contact/page.tsx",
      "app/company/page.tsx",
    ];

    for (const relativePath of pageSources) {
      expect(readSource(relativePath)).not.toContain("| ${siteConfig.name}");
    }
  });

  it("builds canonical, Open Graph, and X Card fields from a page path", () => {
    const metadata = createPageMetadata({
      title: "CONCEPT",
      description: "ブランドコンセプト",
      path: "/concept",
    });

    expect(metadata.alternates).toEqual({ canonical: "/concept" });
    expect(metadata.openGraph).toMatchObject({
      type: "website",
      locale: "ja_JP",
      siteName: siteConfig.name,
      title: "CONCEPT",
      url: "/concept",
      images: [
        {
          url: siteConfig.ogImage,
          width: siteConfig.ogImageWidth,
          height: siteConfig.ogImageHeight,
        },
      ],
    });
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      title: "CONCEPT",
      images: [siteConfig.ogImage],
    });
  });

  /**
   * og:type=product は metadata の other でしか出せず、Next.js が
   * `property=` ではなく `name="og:type"` を書くため Facebook が読まない。
   * 有効な og:type が消える方が損なので website / article に限る。
   */
  it("og:type は openGraph.type だけで出し、other を使わない", () => {
    for (const ogType of ["website", "article"] as const) {
      const metadata = createPageMetadata({
        description: "説明",
        path: "/example",
        ogType,
      });

      expect(metadata.other).toBeUndefined();
      expect(metadata.openGraph).toMatchObject({ type: ogType });
    }
  });

  it("OG 画像の寸法を渡せる（Facebook / LINE の初回クロール用）", () => {
    const metadata = createPageMetadata({
      description: "商品",
      path: "/products/moya500",
      image: { url: "https://cdn.example.com/a.jpg", width: 1200, height: 630 },
    });

    expect(metadata.openGraph).toMatchObject({
      images: [{ url: "https://cdn.example.com/a.jpg", width: 1200, height: 630 }],
    });
    expect(metadata.twitter).toMatchObject({
      images: ["https://cdn.example.com/a.jpg"],
    });
  });

  it("keeps confirm and account pages out of the index", () => {
    const metadata = createPageMetadata({
      title: "カート",
      description: "カート",
      path: "/cart",
      index: false,
    });

    expect(metadata.robots).toMatchObject({
      index: false,
      follow: false,
    });
  });

  // 送信完了・確認ページは2系統あるので、どちらの導線か title で区別できるようにする
  it("お問い合わせ系と初期不良・修理系で title が重複しない", () => {
    const titles = [
      "app/contact/confirm/page.tsx",
      "app/contact/thanks/page.tsx",
      "app/support/confirm/page.tsx",
      "app/support/thanks/page.tsx",
    ].map((relativePath) => {
      const match = readSource(relativePath).match(/title: "([^"]+)"/);

      expect(match, `${relativePath} に title がありません`).not.toBeNull();

      return match![1];
    });

    expect(new Set(titles).size).toBe(titles.length);
  });

  // 画面に出る呼び名は「初期不良・修理」なので、meta だけ別の呼び方にしない
  it("Support の meta は画面と同じ「初期不良・修理」を使う", () => {
    for (const relativePath of ["app/support/confirm/page.tsx", "app/support/thanks/page.tsx"]) {
      const source = readSource(relativePath);

      expect(source, relativePath).toContain("初期不良・修理");
      expect(source, relativePath).not.toContain("製品保証・修理");
    }
  });
});
