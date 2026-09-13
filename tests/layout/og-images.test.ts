import { readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { newsItems } from "@/data/news";
import {
  NEWS_OG_IMAGE_HEIGHT,
  NEWS_OG_IMAGE_WIDTH,
  getNewsOgImage,
} from "@/lib/news/og-image";
import { siteConfig } from "@/lib/site";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../..");

/** JPEG の SOF マーカーから実寸を読む（宣言した寸法と実ファイルのズレを防ぐ） */
function readJpegSize(filePath: string): { width: number; height: number } {
  const buffer = readFileSync(filePath);

  expect(buffer.readUInt16BE(0)).toBe(0xffd8);

  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) {
      throw new Error(`JPEG マーカーが見つかりません: ${filePath}`);
    }

    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);

    // SOF0 / SOF1 / SOF2（プログレッシブ含む）に寸法が入る
    if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7),
      };
    }

    offset += 2 + length;
  }

  throw new Error(`SOF マーカーが見つかりません: ${filePath}`);
}

/**
 * OG 画像は WebP にしない。LINE / Facebook は JPG / PNG のみ対応で、
 * ローカル配信は Shopify CDN と違って Accept による出し分けがないため、
 * WebP を指すとプレビューが出ない。
 */
function expectUsableOgImage(publicPath: string) {
  const filePath = join(rootDir, "public", publicPath);

  expect(publicPath.endsWith(".jpg")).toBe(true);

  // 取得に時間がかかるとサムネイルを諦めるクローラーがあるため
  expect(statSync(filePath).size).toBeLessThan(500 * 1024);

  return readJpegSize(filePath);
}

describe("OG 画像の実ファイル", () => {
  it("共通 OG 画像が宣言どおりの寸法で実在する", () => {
    expect(expectUsableOgImage(siteConfig.ogImage)).toEqual({
      width: siteConfig.ogImageWidth,
      height: siteConfig.ogImageHeight,
    });
  });

  it("News の OG 画像が全記事分 1200×630 の JPEG で実在する", () => {
    expect(newsItems.length).toBeGreaterThan(0);

    for (const article of newsItems) {
      const ogImage = getNewsOgImage(article);

      expect(ogImage, `${article.handle} に ogImage がありません`).toBeDefined();

      expect(expectUsableOgImage(ogImage!.url)).toEqual({
        width: NEWS_OG_IMAGE_WIDTH,
        height: NEWS_OG_IMAGE_HEIGHT,
      });
    }
  });

  // 記事画像は表示用の WebP のまま。OG に流用されていないことを担保する
  it("記事画像そのものを OG に使っていない", () => {
    for (const article of newsItems) {
      expect(getNewsOgImage(article)?.url).not.toBe(article.image);
    }
  });
});
