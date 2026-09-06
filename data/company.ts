import type { CompanyContent } from "@/types/company";

export const companyContent = {
  title: "ABOUT US",
  items: [
    {
      label: "会社名",
      blocks: [{ type: "paragraph", text: "株式会社NSS" }],
    },
    {
      label: "本社所在地",
      blocks: [{ type: "paragraph", text: "〒816-0902 福岡県大野城市乙金1-10-40" }],
    },
    {
      label: "TEL",
      blocks: [{ type: "paragraph", text: "092-580-8707" }],
    },
    {
      label: "FAX",
      blocks: [{ type: "paragraph", text: "092-580-8708" }],
    },
    {
      label: "代表者",
      blocks: [{ type: "paragraph", text: "代表取締役社長　針北 義文" }],
    },
    {
      label: "設立",
      blocks: [{ type: "paragraph", text: "1997年12月16日" }],
    },
    {
      label: "資本金",
      blocks: [{ type: "paragraph", text: "50,000,000円" }],
    },
    {
      label: "決算期",
      blocks: [{ type: "paragraph", text: "11月末日（年1回）" }],
    },
    {
      label: "事業内容",
      blocks: [
        {
          type: "linkedLine",
          text: "アウトドア製品の開発・製造・販売",
          href: "https://candpluss.camp/",
        },
        {
          type: "linkedLine",
          text: "フィットネス機器の販売 | EVOLGEAR（エヴォルギア）",
          href: "https://evolgear.com/",
        },
        {
          type: "linkedLine",
          text: "監視カメラシステムの卸販売",
          href: "https://cpcam.jp/security/",
        },
        {
          type: "linkedLine",
          text: "デジタルサイネージシステムの卸販売",
          href: "https://cpcam.jp/signage/",
        },
        {
          type: "linkedLine",
          text: "デジタルサイネージシステムのレンタル",
          href: "https://cpcam.jp/signage_rental/",
        },
      ],
    },
    {
      label: "取引銀行",
      blocks: [
        {
          type: "bullets",
          items: [
            "株式会社三菱UFJ銀行",
            "株式会社福岡銀行",
            "株式会社筑邦銀行",
            "株式会社西日本シティ銀行",
          ],
        },
      ],
    },
  ],
} as const satisfies CompanyContent;
