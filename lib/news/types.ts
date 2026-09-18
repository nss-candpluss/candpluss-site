/** 本文中の語句に付けるインラインリンク */
export type NewsArticleInlineLink = {
  /** content 内の対象語句。最初の一致だけリンクになる */
  text: string;
  href: string;
};

/** Shopify Storefront API Article へ差し替えやすい共通型 */
export type NewsArticle = {
  id: string;
  title: string;
  tag: string;
  /** 一覧・TOP 用要約。未設定時は content から自動生成 */
  excerpt?: string;
  image: string;
  /**
   * 詳細ページのメイン画像の代替テキスト。
   * 一覧・TOP のカードは見出しがリンク名になるため alt="" のままにする。
   * 画像に文字が入っている場合はその文字も含める。
   */
  imageAlt?: string;
  /**
   * SNS 用 OG 画像（1200×630 の JPEG / public/images/news/og/）。
   * image は WebP で LINE / Facebook が読めないため OG には使えない。
   * 未設定の記事は共通 OG 画像にフォールバックする。
   */
  ogImage?: string;
  publishedAt: string;
  handle: string;
  content: string;
  /**
   * 詳細本文中の語句に付けるリンク（任意）。
   * 一覧・TOP のカードはカード全体がリンクなので本文はテキストのまま表示する。
   */
  inlineLinks?: readonly NewsArticleInlineLink[];
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
