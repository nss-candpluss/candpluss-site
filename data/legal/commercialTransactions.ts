import type { CommercialTransactionsContent } from "@/types/legal";

export const commercialTransactionsContent = {
  title: "特定商取引法に基づく表記",
  items: [
    {
      label: "販売業者",
      blocks: [{ type: "paragraph", text: "株式会社NSS（ブランド名：Cand+S）" }],
    },
    {
      label: "運営責任者",
      blocks: [{ type: "paragraph", text: "針北 義文" }],
    },
    {
      label: "住所",
      blocks: [{ type: "paragraph", text: "〒816-0902　福岡県大野城市乙金1-10-40" }],
    },
    {
      label: "電話番号",
      blocks: [
        {
          type: "paragraph",
          text: "092-504-7370（受付時間：9:00〜17:00 土・日・祝日を除く）",
        },
      ],
    },
    {
      label: "メールアドレス",
      blocks: [
        {
          type: "paragraph",
          text: "info@cpcam.jp（代表） / info@candpluss.camp（ショップ窓口）",
        },
      ],
    },
    {
      label: "ホームページURL",
      blocks: [{ type: "paragraph", text: "https://candpluss.camp/" }],
    },
    {
      label: "商品の販売価格",
      blocks: [
        {
          type: "paragraph",
          text: "各商品ページに記載（表示価格は消費税込み）",
        },
      ],
    },
    {
      label: "商品代金以外に必要な料金",
      blocks: [
        {
          type: "paragraph",
          text: "・送料：全国一律【〇〇】円（税込価格【〇〇】円以上で送料無料）",
        },
        {
          type: "paragraph",
          text: "・各種決済手数料（代引き手数料、後払い手数料など）",
        },
      ],
    },
    {
      label: "支払方法",
      blocks: [
        {
          type: "paragraph",
          text: "クレジットカード決済、【その他決済方法（Shopifyペイメントで有効な方法等）】",
        },
      ],
    },
    {
      label: "支払時期",
      blocks: [
        {
          type: "paragraph",
          text: "注文完了手続き時にシステム上で決済処理が行われます。お支払い期限はご利用の決済手段（カード会社等）の規約に基づきます。",
        },
      ],
    },
    {
      label: "商品の引渡時期",
      blocks: [
        {
          type: "paragraph",
          text: "決済承認（またはご入金確認）後、【〇】営業日以内に発送いたします。ただし、予約商品等の場合は商品ページに記載の納期に基づきます。",
        },
      ],
    },
    {
      label: "返品・交換・キャンセルについて",
      blocks: [
        { type: "subheading", text: "■不良品・誤配送の場合" },
        {
          type: "paragraph",
          text: "商品に初期不良（破損・不具合）またはご注文内容と異なる商品が届いた場合には、商品到着後【7日】以内にご連絡ください。確認の上、返品または交換を承ります。この場合の返送料は当社が負担いたします。",
        },
        {
          type: "paragraph",
          text: "なお、商品の状態確認のために通常想定される方法で行われた開封・使用については、返品・交換を妨げるものではありません。",
        },
        { type: "subheading", text: "■お客様都合による返品・交換" },
        {
          type: "paragraph",
          text: "商品に不具合がない場合の返品・交換は、未使用かつ未開封の商品に限り、商品到着後7日以内に限り承ります。この場合の返送料その他返品に要する費用はお客様のご負担となります。",
        },
        { type: "subheading", text: "■返品・交換をお受けできない場合" },
        {
          type: "paragraph",
          text: "以下の場合には返品・交換をお受けできません。",
        },
        {
          type: "bullets",
          items: [
            "商品到着後8日以上経過した場合",
            "使用済みまたは開封済みの商品（不良品確認の範囲を除く）",
            "お客様の責任により破損または汚損した商品",
            "商品ページに返品不可と明示された商品",
          ],
        },
        { type: "subheading", text: "■キャンセルについて" },
        {
          type: "paragraph",
          text: "ご注文確定後のキャンセルは原則としてお受けしておりません。ただし、商品出荷前であり、かつ当社において対応可能と判断した場合に限り、キャンセルを承ることがあります。",
        },
        { type: "subheading", text: "■返金について" },
        {
          type: "paragraph",
          text: "返品に伴う返金は、返品商品の到着および状態確認後、合理的期間内に、原則としてご利用の決済手段に応じた方法により行います。",
        },
      ],
    },
    {
      label: "本表記の変更について",
      blocks: [
        {
          type: "paragraph",
          text: "当社は、消費税法の改正、送料改定、決済手段の追加・変更、その他必要と判断した場合には、本表記の内容を事前の予告なく変更できるものとします。変更後の内容は、本サイト上に掲載された時点から効力を生じるものとします。",
        },
      ],
    },
  ],
} as const satisfies CommercialTransactionsContent;
