import type { NewsArticle } from "./types";

/** メタデータ用。excerpt 未設定時は content 先頭を使用 */
export function resolveArticleExcerpt(
  article: Pick<NewsArticle, "excerpt" | "content">
): string {
  const excerpt = article.excerpt?.trim();

  if (excerpt) {
    return excerpt;
  }

  return article.content.replace(/\s+/g, " ").trim();
}
