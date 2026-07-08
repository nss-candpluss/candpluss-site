import type { NewsArticle } from "@/lib/news/types";

/**
 * 将来の Shopify Blog（Articles）連携用。
 * Storefront API の Article → NewsArticle へ変換する責務を持つ。
 *
 * 連携後は lib/news/source/index.ts の newsArticleSource を
 * shopifyNewsSource に差し替える。
 */
export async function fetchShopifyNewsArticles(): Promise<NewsArticle[]> {
  throw new Error("Shopify Blog integration is not implemented yet.");
}

/** Shopify Article フィールド → NewsArticle 変換（実装時に使用） */
export function mapShopifyArticleToNewsArticle(
  shopifyArticle: unknown
): NewsArticle {
  void shopifyArticle;
  throw new Error("Shopify Blog integration is not implemented yet.");
}
