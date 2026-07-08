import type { NewsArticle } from "../types";

import { fetchLocalNewsArticles } from "./local";

export type NewsArticleSource = {
  getAllArticles(): Promise<NewsArticle[]>;
};

const localNewsSource: NewsArticleSource = {
  getAllArticles: fetchLocalNewsArticles,
};

/**
 * News 記事の取得元。
 * Shopify 連携時は lib/shopify/articles.ts の実装に差し替える。
 */
export const newsArticleSource: NewsArticleSource = localNewsSource;
