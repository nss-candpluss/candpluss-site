/** Shopify Storefront API Article へ差し替えやすい共通型 */
export type NewsArticle = {
  id: string;
  title: string;
  tag: string;
  /** 一覧・TOP 用要約。未設定時は content から自動生成 */
  excerpt?: string;
  image: string;
  publishedAt: string;
  handle: string;
  content: string;
  /** 詳細本文末尾の内部リンク（任意） */
  contentLink?: {
    label: string;
    href: string;
  };
};

export type NewsArticlesPagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type GetNewsArticlesResult = {
  articles: NewsArticle[];
  pagination: NewsArticlesPagination;
};

export type GetNewsArticlesOptions = {
  page?: number;
  pageSize?: number;
};
