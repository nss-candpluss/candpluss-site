import type { ShoppingGuideContent } from "@/types/shoppingGuide";

export const shoppingGuideContent = {
  title: "ショッピングガイド",
  sections: [
    {
      title: "送料・配送について",
      subsections: [
        {
          blocks: [
            {
              type: "paragraph",
              text: "■送料について\n・送料：全国一律700円（税込価格5,000円以上で送料無料）\n・各種決済手数料（代引き手数料、後払い手数料など）",
            },
          ],
        },
        {
          blocks: [
            {
              type: "paragraph",
              text: "■お届け日数に関して\n決済承認（またはご入金確認）後、通常3営業日以内に発送いたします。ただし、予約商品等の場合は商品ページに記載の納期に基づきます。\n土・日・祝日の発送は行っておりません。\n配送に関するお問い合わせにはご回答できかねますので、お問い合わせはご遠慮ください。\nその他、下記理由により商品の発送が遅れる場合がございます。",
            },
            {
              type: "bullets",
              items: [
                "年末年始、夏季休暇、棚卸、社員研修等により発送作業を行えない場合",
                "オンラインストアの受注が混み合い作業にお時間をいただく場合",
                "天災や交通事情による配送遅延が起きた場合",
              ],
            },
          ],
        },
        {
          blocks: [
            {
              type: "paragraph",
              text: "■配送時間指定\n弊社では日時指定日は承っておりません。最短での発送に努めておりますのでご了承ください。\n発送完了後の日時指定は佐川急便、（修理用パーツはヤマト運輸）のサービスをご利用頂けます。\n佐川急便、ヤマト運輸サイトで変更の場合は、発送メールに記載の伝票番号をご確認の上お手続きください。",
            },
            { type: "paragraph", text: "■佐川急便「スマートクラブ」ご案内" },
            {
              type: "link",
              label: "https://www.sagawa-exp.co.jp/service/smartclub/",
              href: "https://www.sagawa-exp.co.jp/service/smartclub/",
              external: true,
            },
            { type: "paragraph", text: "■ヤマト運輸「クロネコメンバーズ」ご案内" },
            {
              type: "link",
              label: "https://www.kuronekoyamato.co.jp/ytc/customer/members/",
              href: "https://www.kuronekoyamato.co.jp/ytc/customer/members/",
              external: true,
            },
            {
              type: "paragraph",
              text: "※天災や交通事情、お届け先のご不在等の諸事情で、ご希望の時間にお届けできない場合があります。",
            },
          ],
        },
        {
          blocks: [
            {
              type: "paragraph",
              text: "■配送方法\n商品は宅配便にて国内より発送いたします。配送業者は、佐川急便になります。",
            },
          ],
        },
        {
          blocks: [
            {
              type: "paragraph",
              text: "■海外配送について\nYou can order globally here.\n（Please note that if you use a forwarding service to ship globally from this website, we cannot accept returns or exchanges for incorrectly sent or defective products.）\nPlease note that shipping fees, customs duties, etc. will be charged separately for international shipping.",
            },
          ],
        },
      ],
    },
    {
      title: "ご注文について",
      subsections: [
        {
          blocks: [
            {
              type: "paragraph",
              text: "お電話、FAX、メールでのご注文は承っておりません。\nご注文は公式オンラインショップよりお申し込みください。\nより多くのお客様にご購入いただけるよう、購入制限を設けさせて頂いている商品がございます。\n制限数以上のご注文が入った場合はキャンセルさせて頂きます事もございますのでご了承下さい。\n制限数については商品購入ページをご確認ください。\n個人向け販売オンラインショップとなっております。常識の範囲を超える大量のご注文を頂いた場合、ご注文をキャンセルさせて頂く場合がございます。予めご了承下さい。",
            },
          ],
        },
      ],
    },
    {
      title: "お支払いについて",
      subsections: [
        {
          blocks: [
            {
              type: "paragraph",
              text: "クレジットカード決済、Google Pay、Apple Pay、Amazon Pay、銀行振込\n注文完了手続き時にシステム上で決済処理が行われます。お支払い期限はご利用の決済手段（カード会社等）の規約に基づきます。",
            },
            {
              type: "paragraph",
              text: "■クレジットカード決済\nご利用頂けるカードはVISA、Mastercard、JCB、American Expressとなります。\nお支払い方法は、「一括払い」のみとなります。",
            },
            {
              type: "paragraph",
              text: "■Shop Pay\nネットショップシステムShopifyが提供する決済サービスです。\nShop Payにてメールアドレスと携帯電話番号を登録すると、次回購入時にメールアドレスと携帯電話番号宛てに送られる6桁のショップペイコード（SMS認証）を入力するだけで、配送先やクレジットカード情報を再度入力することなく、簡単に支払いができます。\n弊社では登録情報の編集、削除が行えません。お客様ご自身で下記よりお手続きをお願いいたします。\nShop Pay ログインページは こちら>>\nShop Pay アカウント削除ページは こちら>>",
            },
            {
              type: "paragraph",
              text: "■Apple Pay\nApple PayはiPhoneおよびApple Watch、iPadなどApple製品でご利用可能な決済サービスです。\nあらかじめクレジットカードを登録しておけば、クレジットカード情報の入力を行うことなく、簡単・安全に決済ができます。",
            },
            {
              type: "paragraph",
              text: "■Google Pay\nGoogle Payはおサイフケータイ対応のAndroidスマートフォンでご利用可能な決済サービスです。\nあらかじめクレジットカードを登録しておけば、クレジットカード情報の入力を行うことなく、簡単・安全に決済ができます。",
            },
            {
              type: "paragraph",
              text: "■Amazon Pay\nAmazonアカウントに登録されたお支払い方法・配送先情報を利用して決済できます。",
            },
            {
              type: "paragraph",
              text: "■銀行振込\n銀行振込でのお支払いもご利用いただけます。お支払い期限はご利用の決済手段（カード会社等）の規約に基づきます。",
            },
          ],
        },
      ],
    },
    {
      title: "在庫について",
      subsections: [
        {
          blocks: [
            {
              type: "paragraph",
              text: "カートに入れた時点では商品の在庫は確保されません。\n決済ページの「今すぐ支払う」をクリック後、注文完了画面が表示されましたら在庫確保となります。\n万が一、ご注文いただきました商品が在庫切れの場合、メールでお知らせ後にキャンセル処理をさせていただきます。",
            },
            {
              type: "paragraph",
              text: "■入荷通知について\n各製品ページの入荷通知メールにご登録頂けますと入荷次第、自動配信メールにてお知らせいたします。\n※入荷通知に関するご注意点\n・製品の再入荷をお知らせするもので、製品の予約を承るものではございません。\n・ご登録いただいても、再入荷がない可能性もございます。\n・再入荷お知らせメール配信後、すぐに売り切れとなる可能性もございます。\n・再入荷通知メールの配信は1回のみです。もう一度同じ製品の通知を受け取りたい場合は、あらためてご登録ください。",
            },
          ],
        },
      ],
    },
    {
      title: "返品・交換・キャンセルについて",
      subsections: [
        {
          blocks: [
            {
              type: "paragraph",
              text: "■不良品・誤配送の場合\n商品に初期不良（破損・不具合）またはご注文内容と異なる商品が届いた場合には、商品到着後8日以内にご連絡ください。確認の上、返品または交換を承ります。この場合の返送料は当社が負担いたします。\nなお、商品の状態確認のために通常想定される方法で行われた開封・使用については、返品・交換を妨げるものではありません。",
            },
            {
              type: "paragraph",
              text: "■お客様都合による返品・交換\n商品に不具合がない場合の返品・交換は、未使用かつ未開封の商品に限り、商品到着後7日以内に限り承ります。この場合の返送料その他返品に要する費用はお客様のご負担となります。",
            },
            {
              type: "paragraph",
              text: "■返品・交換をお受けできない場合\n以下の場合には返品・交換をお受けできません。\n・商品到着後9日以上経過した場合\n・使用済みまたは開封済みの商品（不良品確認の範囲を除く）\n・お客様の責任により破損または汚損した商品\n・商品ページに返品不可と明示された商品",
            },
            {
              type: "paragraph",
              text: "■キャンセルについて\nご注文確定後のキャンセルは原則としてお受けしておりません。ただし、商品出荷前であり、かつ当社において対応可能と判断した場合に限り、キャンセルを承ることがあります。",
            },
            {
              type: "paragraph",
              text: "■返金について\n返品に伴う返金は、返品商品の到着および状態確認後、合理的期間内に、原則としてご利用の決済手段に応じた方法により行います。",
            },
          ],
        },
      ],
    },
    {
      title: "領収書、納品書について",
      subsections: [
        {
          blocks: [
            {
              type: "paragraph",
              text: "金額が記載されたお買い上げ領収書、納品書は、お届けする製品には同梱しておりません。\n商品発送後にマイページの注文履歴ページ（ログイン必要）から領収書を発行していただくか、商品発送のお知らせメールから遷移できる注文履歴ページ（ログイン必要）から領収書の発行が可能です。\n※領収書発行には会員登録が必要になります。\n※領収書は発行後の宛名や但し書きの変更が出来かねますのでご了承ください。",
            },
          ],
        },
      ],
    },
  ],
} as const satisfies ShoppingGuideContent;
