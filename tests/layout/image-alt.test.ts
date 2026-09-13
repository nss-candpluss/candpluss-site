import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { newsItems } from "@/data/news";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../..");

function readSource(relativePath: string) {
  return readFileSync(join(rootDir, relativePath), "utf8");
}

describe("画像の代替テキスト", () => {
  /**
   * 詳細ページのメイン画像は見出し直下に出る記事の主要ビジュアルなので、
   * 記事ごとに説明を持たせる。
   */
  it("News の全記事に詳細ページ用の imageAlt がある", () => {
    for (const article of newsItems) {
      expect(article.imageAlt?.trim(), `${article.handle} の imageAlt`).toBeTruthy();
    }
  });

  it("News 詳細ページが imageAlt を使っている", () => {
    expect(readSource("app/news/[handle]/page.tsx")).toContain(
      'alt={article.imageAlt ?? ""}'
    );
  });

  /**
   * 一覧・TOP のカードは画像全体がリンクで、隣に見出しがある。
   * ここに alt を入れると記事タイトルが二重に読み上げられる。
   */
  it("News カードの画像は alt を空のままにする", () => {
    const source = readSource("components/news/NewsCard.tsx");

    expect(source).toContain('alt=""');
    expect(source).not.toContain("article.imageAlt");
  });

  /**
   * 選択肢のない商品は Shopify の variant.title が "Default Title" になる。
   * 代替テキストに内部値が出ないよう、代替テキストは商品名だけにする。
   */
  it("商品画像の代替テキストに Shopify の内部値を使わない", () => {
    const source = readSource("lib/shopify/products.ts");

    expect(source).toContain("variantFallbackAlt");
    expect(source).toContain("isPlaceholderProductVariantName");
    expect(source).not.toContain("`${product.title} ${variant.title}`");
  });

  it("サイズ図面の代替テキストは英語固定にしない", () => {
    const source = readSource("lib/shopify/products.ts");

    expect(source).not.toContain('"Size drawing"');
    expect(source).toContain("サイズ図面");
  });
});
