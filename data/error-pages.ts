export const notFoundContent = {
  code: "404",
  title: "ページが見つかりません",
  body: [
    "お探しのページは、移動または削除された可能性があります。",
    "お手数ですが、下記のリンクよりお進みください。",
  ],
  links: [
    { label: "HOME", href: "/" },
    { label: "PRODUCTS", href: "/products" },
    { label: "お問い合わせ", href: "/contact" },
  ],
} as const;

export const errorPageContent = {
  title: "問題が発生しました",
  body: [
    "ページの読み込み中に問題が発生しました。",
    "お手数ですが、再度読み込むかしばらく経ってからお試しください。",
  ],
  retryLabel: "再読み込み",
  links: [
    { label: "HOME", href: "/" },
    { label: "お問い合わせ", href: "/contact" },
  ],
} as const;

/** ルートレイアウトごと失敗した場合。Header / Footer もフォントも読み込めない前提の最小構成 */
export const globalErrorContent = {
  title: "問題が発生しました",
  body: "ページの読み込み中に問題が発生しました。お手数ですが、再度読み込んでお試しください。",
  retryLabel: "再読み込み",
} as const;
