/** 本文中の語句に付けるインラインリンク */
export type NewsArticleInlineLink = {
  /** content 内の対象語句。最初の一致だけリンクになる */
  text: string;
  href: string;
};

/** 詳細本文の製品カード。クリックで説明とギャラリーのポップアップを開く */
export type NewsExhibitProduct = {
  name: string;
  category: string;
  image?: string;
  /** 製品名の左に出すタグ */
  tag?: "初公開" | "参考出展";
  /** ポップアップのギャラリー画像（一覧と同じ 6:5 で表示する） */
  gallery: readonly string[];
  /** ポップアップの見出し下に出すキャッチコピー */
  catchcopy: string;
  /** ポップアップの説明文 */
  description: string;
  /** ポップアップ下部の「商品詳細ページへ」のリンク先。商品ページが無い製品は未設定 */
  href?: string;
};

/** 詳細本文を文章・見出し・画像・製品カードの順に並べるためのブロック */
export type NewsArticleBodyBlock =
  | { type: "text"; content: string; inlineLinks?: readonly NewsArticleInlineLink[] }
  | { type: "heading"; text: string }
  /** 元画像の縦横比のまま全幅で表示する */
  | { type: "image"; src: string; alt: string; width: number; height: number }
  | { type: "products"; items: readonly NewsExhibitProduct[] };

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
  /**
   * 指定時は詳細本文を content ではなくこちらで描画する（任意）。
   * 一覧・TOP のカードと meta description は引き続き content を使う。
   */
  body?: readonly NewsArticleBodyBlock[];
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
