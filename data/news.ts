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
    id: "004",
    title: "FIELDSTYLE EXPO 2026出展決定！",
    tag: "Information",
    excerpt:
      "FIELDSTYLE EXPO 2026（2026年11月14日〜15日／AICHI SKY EXPO）への出展が決定しました。ドームシェルター「MOYA500」「MOYA420」、タープ「NOKUTA」ほか多数の製品を展示予定です。",
    image: "/images/news/news-20260918-01.webp",
    imageAlt:
      "FIELDSTYLE EXPO 2026 の告知ビジュアル。OUTDOOR & LIFESTYLE FESTA FIELDSTYLE EXPO 2026 11.14sat 15sun Aichi Sky Expo",
    ogImage: "/images/news/og/news-20260918-01.jpg",
    publishedAt: "2026-09-18",
    handle: "fieldstyle-expo-2026",
    content:
      "ドームシェルター「MOYA500」「MOYA420」、そしてタープ「NOKUTA」など、多数の製品を展示予定です。\n\n近づいてわかる、生地の質感。\nそこから広がる、次のキャンプのイメージ。\n写真では伝えきれない魅力を、ぜひ会場でお確かめください。\n\nC AND+Sブースでのイベント内容は現在企画中。\n詳細はC AND+S公式Instagramアカウントで順次お届けします。\n是非フォローして続報をお待ちください。\n\n■FIELDSTYLE EXPO 2026\n開催：2026年11月14日（土）〜15日（日）\n会場：AICHI SKY EXPO（愛知国際展示場）",
    inlineLinks: [
      {
        text: "C AND+S公式Instagramアカウント",
        href: "https://www.instagram.com/c_and_plus_s?igsh=MXI0bDJ6Znp3bm81dw==",
      },
    ],
  },
  {
    id: "001",
    title: "MOYA500販売開始日のお知らせ",
    tag: "Information",
    excerpt:
      "ドームシェルター「MOYA500」の販売開始日が決定いたしました。",
    image: "/images/news/news-20260912-02.webp",
    imageAlt: "草原に設営したドームシェルター MOYA500 Classic Yellow",
    ogImage: "/images/news/og/news-20260912-02.jpg",
    publishedAt: "2026-09-15",
    handle: "moya500-order-information",
    content:
      "ドームシェルター「MOYA500」の販売開始日が決定いたしました。\n2026年10月2日（金曜日）20:00より、販売開始いたします。\n初回販売分は数量限定となりますので、ご希望のお客様はお早めにご購入ください。\nまた、オプション製品や各種アクセサリーも同日販売開始となりますので、MOYA500本体とあわせてぜひご覧ください。",
    contentLink: {
      label: "MOYA500 商品ページ",
      href: "/products/moya500",
    },
  },
  {
    id: "002",
    title: "C AND+S公式WEBサイトOPEN",
    tag: "Information",
    excerpt:
      "C AND+S 公式WEBサイトを公開しました。ブランドの想いやプロダクト情報を、これから順次お届けしていきます。",
    image: "/images/news/news-20260912-01.webp",
    imageAlt:
      "湖畔に設営したドームシェルター MOYA と、タグライン Find your soul. Touch the ground.",
    ogImage: "/images/news/og/news-20260912-01.jpg",
    publishedAt: "2026-09-15",
    handle: "official-website-open",
    content:
      "このたび、C AND+S公式WEBサイトを公開いたしました。\n本サイトでは、ブランドについてのご紹介をはじめ、製品情報や最新のお知らせなどを随時発信してまいります。\nこれからも、より良い製品づくりとサービスの向上に努めてまいりますので、今後ともC AND+Sをよろしくお願いいたします。",
  },
  {
    id: "003",
    title: "C AND+S公式Instagramを開設しました",
    tag: "Information",
    excerpt:
      "C AND+S公式Instagramを開設しました。ブランドコンセプトや製品情報、イベント情報など、最新情報を発信してまいります。",
    image: "/images/news/news-20260708-03.webp",
    imageAlt: "C AND+S のロゴと、公式Instagramアカウント @c_and_plus_s",
    ogImage: "/images/news/og/news-20260708-03.jpg",
    publishedAt: "2026-07-08",
    handle: "official-instagram-open",
    content:
      "C AND+S公式Instagramを開設しました。\nブランドコンセプトをはじめ、製品情報、イベント情報など、ブランドの最新情報を発信してまいります。\nぜひフォローして、C AND+Sの最新情報をご覧ください。",
    contentLink: {
      label: "Follow Us",
      href: "https://www.instagram.com/c_and_plus_s?igsh=MXI0bDJ6Znp3bm81dw==",
    },
  },
] as const satisfies readonly NewsArticle[];
