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
});
