import type {
  GetNewsArticlesOptions,
  GetNewsArticlesResult,
  NewsArticle,
} from "./types";
import { newsArticleSource } from "./source";

const DEFAULT_PAGE_SIZE = 12;

/** News 一覧の1ページあたり最大件数 */
export const NEWS_LIST_PAGE_SIZE = 10;

/** TOP News & Topics セクションの表示件数 */
export const HOME_NEWS_DISPLAY_LIMIT = 3;

function sortArticlesByDate(articles: readonly NewsArticle[]): NewsArticle[] {
  const order = new Map(articles.map((article, index) => [article.id, index]));

  return [...articles].sort((a, b) => {
    const dateDiff =
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();

    if (dateDiff !== 0) {
      return dateDiff;
    }

    return (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0);
  });
}

async function getAllArticlesSorted(): Promise<NewsArticle[]> {
  const articles = await newsArticleSource.getAllArticles();
  return sortArticlesByDate(articles);
}

export async function getLatestArticles(limit: number): Promise<NewsArticle[]> {
  return (await getAllArticlesSorted()).slice(0, limit);
}

export async function getArticles(
  options: GetNewsArticlesOptions = {}
): Promise<GetNewsArticlesResult> {
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.max(1, options.pageSize ?? DEFAULT_PAGE_SIZE);
  const sorted = await getAllArticlesSorted();
  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const normalizedPage = Math.min(page, totalPages);
  const start = (normalizedPage - 1) * pageSize;

  return {
    articles: sorted.slice(start, start + pageSize),
    pagination: {
      page: normalizedPage,
      pageSize,
      total,
      totalPages,
    },
  };
}

export async function getArticleByHandle(
  handle: string
): Promise<NewsArticle | null> {
  const articles = await newsArticleSource.getAllArticles();
  return articles.find((item) => item.handle === handle) ?? null;
}

export async function getAdjacentArticlesByHandle(handle: string): Promise<{
  newer: NewsArticle | null;
  older: NewsArticle | null;
}> {
  const sorted = await getAllArticlesSorted();
  const index = sorted.findIndex((item) => item.handle === handle);

  if (index === -1) {
    return { newer: null, older: null };
  }

  return {
    newer: index > 0 ? sorted[index - 1] : null,
    older: index < sorted.length - 1 ? sorted[index + 1] : null,
  };
}

export async function getAllArticleHandles(): Promise<string[]> {
  const articles = await newsArticleSource.getAllArticles();
  return articles.map((item) => item.handle);
}
