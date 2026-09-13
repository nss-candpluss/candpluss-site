export const siteConfig = {
  name: "C AND+S",
  legalName: "株式会社NSS",
  description: "C AND+S ブランドサイト兼EC導線サイト",
  locale: "ja-JP",
  url: "https://candpluss.camp",
  email: "info@candpluss.camp",
  /** C AND+S ブランド専用のお客様窓口（Support ページと同一） */
  telephone: "0120-64-8175",
  /** 運営会社 株式会社NSS の代表番号（会社概要・特定商取引法の表記と同一） */
  companyTelephone: "+81-92-504-7370",
  logo: "/web-app-manifest-512x512.png",
  address: {
    postalCode: "816-0902",
    addressRegion: "福岡県",
    addressLocality: "大野城市",
    streetAddress: "乙金1-10-40",
    addressCountry: "JP",
  },
  /**
   * SNS シェア時のサムネイル。News と商品ページは個別画像で上書きされる。
   * 差し替える場合は 1200×630（OG 推奨比 1.91:1）を維持し、width / height も更新する。
   * クローラー互換のため WebP ではなく JPEG を使う。
   */
  ogImage: "/images/common/og-default.jpg",
  ogImageWidth: 1200,
  ogImageHeight: 630,
  /** 公開前は false のまま。正式公開時に true に切り替える */
  allowSearchIndexing: false,
} as const;
