import type { NewsArticle } from "@/lib/news/types";

/**
 * News 記事データ。
 * ここに1件追加するだけで、詳細ページ・一覧・TOP へ自動反映される。
 *
 * - 詳細: /news/[handle]（generateStaticParams が handle を自動生成）
 * - 一覧: 日付最新順（NEWS_LIST_PAGE_SIZE 件/ページ）
 * - TOP: 日付最新順 先頭 HOME_NEWS_DISPLAY_LIMIT 件
 *
 * excerpt は任意（meta description 用）。カード本文は content を表示する。
 * 同一日付の並びは、この配列の上から順（上ほど新しい）とする。
 */
export const newsItems = [
  {
    id: "001",
    title: "MOYA500の注文受付・発送日のお知らせ",
    tag: "Information",
    excerpt:
      "ドームシェルター「MOYA500」の予約受付開始日および発送日が決定いたしました。",
    image: "/images/news/news-20260708-02.webp",
    publishedAt: "2026-07-08",
    handle: "moya500-order-information",
    content:
      "ドームシェルター「MOYA500」の予約受付開始日および発送日が決定いたしました。\n予約受付は2026年7月17日より開始し、商品の発送は2026年8月1日より、ご予約いただいた順に順次発送いたします。\n初回販売分は数量限定となりますので、ご希望のお客様はお早めにご予約ください。\nなお、2026年7月17日より、C AND+S公式サイトにてご予約・ご購入いただけます。",
    contentLink: {
      label: "MOYA500 商品ページ",
      href: "/products/moya500",
    },
  },
  {
    id: "002",
    title: "C AND+S 公式WEBサイトOPEN",
    tag: "Information",
    excerpt:
      "C AND+S 公式WEBサイトを公開しました。ブランドの想いやプロダクト情報を、これから順次お届けしていきます。",
    image: "/images/news/news-20260708-01.webp",
    publishedAt: "2026-07-08",
    handle: "official-website-open",
    content:
      "このたび、C AND+S公式WEBサイトを公開いたしました。\nC AND+Sは、キャンプに新たな価値を見つけ、長く使い続けられる品質と使い心地を追求するアウトドアブランドです。\n本サイトでは、ブランドについてのご紹介をはじめ、製品情報や最新のお知らせなどを随時発信してまいります。\nこれからも、より良い製品づくりとサービスの向上に努めてまいりますので、今後とも C AND+S をよろしくお願いいたします。",
  },
  {
    id: "003",
    title: "C AND+S公式インスタグラムを開設しました。",
    tag: "Information",
    excerpt:
      "C AND+S公式Instagramを開設しました。ブランドコンセプトや製品情報、イベント情報など、最新情報を発信してまいります。",
    image: "/images/news/news-20260708-03.webp",
    publishedAt: "2026-07-08",
    handle: "official-instagram-open",
    content:
      "C AND+S公式Instagramを開設しました。\nブランドコンセプトをはじめ、製品情報、イベント情報など、ブランドの最新情報を発信してまいります。\nぜひフォローして、C AND+Sの最新情報をご覧ください。",
    contentLink: {
      label: "Follow US",
      href: "https://www.instagram.com/c_and_plus_s?igsh=MXI0bDJ6Znp3bm81dw==",
    },
  },
] as const satisfies readonly NewsArticle[];
