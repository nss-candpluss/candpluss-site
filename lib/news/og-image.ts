import type { NewsArticle } from "@/lib/news/types";
import type { PageOgImage } from "@/lib/site-metadata";

/** News の OG 画像は 1200×630 の JPEG に統一する（public/images/news/og/） */
export const NEWS_OG_IMAGE_WIDTH = 1200;
export const NEWS_OG_IMAGE_HEIGHT = 630;

/**
 * 記事画像（WebP）は LINE / Facebook のクローラーが読めないため OG には使わない。
 * Shopify CDN の画像と違って Accept による出し分けがなく、
 * `Content-Type: image/webp` がそのまま返るのでプレビューが出ない。
 *
 * 専用 JPEG が未用意の記事は undefined を返し、共通 OG 画像に委ねる。
 */
export function getNewsOgImage(article: NewsArticle): PageOgImage | undefined {
  if (!article.ogImage) {
    return undefined;
  }

  return {
    url: article.ogImage,
    width: NEWS_OG_IMAGE_WIDTH,
    height: NEWS_OG_IMAGE_HEIGHT,
  };
}
