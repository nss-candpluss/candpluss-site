export const siteConfig = {
  name: "C AND+S",
  legalName: "株式会社NSS",
  description: "C AND+S ブランドサイト兼EC導線サイト",
  locale: "ja-JP",
  url: "https://candpluss.camp",
  email: "info@candpluss.camp",
  telephone: "+81-92-580-8707",
  logo: "/web-app-manifest-512x512.png",
  address: {
    postalCode: "816-0902",
    addressRegion: "福岡県",
    addressLocality: "大野城市",
    streetAddress: "乙金1-10-40",
    addressCountry: "JP",
  },
  /** 専用 1200×630 を用意するまでの仮画像 */
  ogImage: "/images/home/home-image.webp",
  /** 公開前は false のまま。正式公開時に true に切り替える */
  allowSearchIndexing: false,
} as const;
