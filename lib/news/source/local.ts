import { newsItems } from "@/data/news";

import type { NewsArticle } from "../types";

/** 現在のデータ源: data/news.ts に記事を追加するだけで詳細・一覧・TOP へ反映 */
export async function fetchLocalNewsArticles(): Promise<NewsArticle[]> {
  return [...newsItems];
}
