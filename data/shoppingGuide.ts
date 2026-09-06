/**
 * ショッピングガイド本文（仮）
 * 正式文言が確定したら、このファイルの内容を差し替えてください。
 */

import type { ShoppingGuideContent } from "@/types/shoppingGuide";

export const shoppingGuideContent = {
  title: "ショッピングガイド",
  sections: [
    {
      title: "送料・配送について",
      subsections: [
        {
          heading: "送料について",
          blocks: [
            {
              type: "paragraph",
              text: "配送料 :1配送につき 990円（税込）、沖縄・離島へのお届けは1,320円（税込）",
            },
            {
              type: "paragraph",
              text: "1注文につき購入合計金額11,000円以上（税込）の場合は送料無料",
            },
            {
              type: "paragraph",
              text: "修理用パーツ販売(個別にご案内)は合計金額に関わらず、下記の配送料となります。",
            },
            { type: "paragraph", text: "本州・四国：990円（税込）" },
            { type: "paragraph", text: "北海道・九州：1,320円（税込）" },
            { type: "paragraph", text: "沖縄 ・離島：2,090円（税込）" },
          ],
        },
        {
          heading: "お届け日数に関して",
          blocks: [
            { type: "subheading", text: "【 お届けにお時間をいただく場合がございます 】" },
            {
              type: "paragraph",
              text: "通常、ご注文を頂いてから1〜2営業日前後の発送となりますが、ご注文状況によっては、5日ほどかかる場合がございますので、ご理解のほど宜しくお願い致します。",
            },
            { type: "paragraph", text: "土・日・祝日の発送は行っておりません。" },
            {
              type: "paragraph",
              text: "配送に関するお問い合わせにはご回答できかねますので、お問い合わせはご遠慮ください。",
            },
            {
              type: "paragraph",
              text: "その他、下記理由により商品の発送が遅れる場合がございます。",
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
          heading: "配送時間指定",
          blocks: [
            {
              type: "paragraph",
              text: "弊社では日時指定日は承っておりません。最短での発送に努めておりますのでご了承ください。",
            },
            {
              type: "paragraph",
              text: "発送完了後の日時指定は佐川急便、(修理用パーツはヤマト運輸)のサービスをご利用頂けます。",
            },
            {
              type: "paragraph",
              text: "佐川急便、ヤマト運輸サイトで変更の場合は、発送メールに記載の伝票番号をご確認の上お手続きください。",
            },
            { type: "subheading", text: "■ 佐川急便「スマートクラブ」ご案内" },
            {
              type: "link",
              label: "https://www.sagawa-exp.co.jp/service/smartclub/",
              href: "https://www.sagawa-exp.co.jp/service/smartclub/",
              external: true,
            },
            { type: "subheading", text: "■ヤマト運輸「クロネコメンバーズ」ご案内" },
            {
              type: "link",
              label: "https://www.kuronekoyamato.co.jp/ytc/customer/members/",
              href: "https://www.kuronekoyamato.co.jp/ytc/customer/members/",
              external: true,
            },
            {
              type: "note",
              text: "※天災や交通事情、お届け先のご不在等の諸事情で、ご希望の時間にお届けできない場合があります。",
            },
          ],
        },
        {
          heading: "配送方法",
          blocks: [
            {
              type: "paragraph",
              text: "商品は宅配便にて国内より発送いたします。 配送業者は、佐川急便になります。",
            },
          ],
        },
        {
          heading: "海外配送について",
          blocks: [
            { type: "paragraph", text: "You can order globally here." },
            // TODO: 正式な海外配送URLが確定したら差し替え
            { type: "paragraph", text: "→正式情報確認中" },
            {
              type: "paragraph",
              text: "(Please note that if you use a forwarding service to ship globally from this website, we cannot accept returns or exchanges for incorrectly sent or defective products.)",
            },
            {
              type: "paragraph",
              text: "Please note that shipping fees, customs duties, etc. will be charged separately for international shipping.",
            },
            {
              type: "paragraph",
              text: "For more information, click here →正式情報確認中",
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
              text: "お電話、FAX、メールでのご注文は承っておりません。",
            },
            {
              type: "paragraph",
              text: "ご注文は公式オンラインショップよりお申し込みください。",
            },
            {
              type: "paragraph",
              text: "出荷作業に進んでいるご注文の内容のご変更・キャンセルはお受けできませんのでご了承ください。",
            },
            {
              type: "paragraph",
              text: "より多くのお客様にご購入いただけるよう、購入制限を設けさせて頂いている商品がございます。",
            },
            {
              type: "paragraph",
              text: "制限数以上のご注文が入った場合はキャンセルさせて頂きます事もございますのでご了承下さい。",
            },
            {
              type: "paragraph",
              text: "制限数については商品購入ページをご確認ください。",
            },
            {
              type: "paragraph",
              text: "個人向け販売オンラインショップとなっております。常識の範囲を超える大量のご注文を頂いた場合、ご注文をキャンセルさせて頂く場合がございます。予めご了承下さい。",
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
            { type: "subheading", text: "【クレジットカード決済】" },
            {
              type: "paragraph",
              text: "ご利用頂けるカードはVISA、Mastercard、JCB、American Expressとなります。",
            },
            {
              type: "paragraph",
              text: "お支払い方法は、「一括払い」のみとなります。",
            },
            { type: "subheading", text: "【Shop Pay】" },
            {
              type: "paragraph",
              text: "ネットショップシステムShopifyが提供する決済サービスです。",
            },
            {
              type: "paragraph",
              text: "Shop Payにてメールアドレスと携帯電話番号を登録すると、次回購入時にメールアドレスと携帯電話番号宛てに送られる6桁のショップペイコード（SMS認証）を入力するだけで、配送先やクレジットカード情報を再度入力することなく、簡単に支払いができます。",
            },
            {
              type: "paragraph",
              text: "弊社では登録情報の編集、削除が行えません。お客様ご自身で下記よりお手続きをお願いいたします。",
            },
            {
              type: "paragraph",
              text: "Shop Pay ログインページは こちら>>",
            },
            {
              type: "paragraph",
              text: "Shop Pay アカウント削除ページは こちら>>",
            },
            { type: "subheading", text: "【Apple Pay】" },
            {
              type: "paragraph",
              text: "Apple PayはiPhoneおよびApple Watch、iPadなどApple製品でご利用可能な決済サービスです。",
            },
            {
              type: "paragraph",
              text: "あらかじめクレジットカードを登録しておけば、クレジットカード情報の入力を行うことなく、簡単・安全に決済ができます。",
            },
            { type: "subheading", text: "【Google Pay】" },
            {
              type: "paragraph",
              text: "Google Payはおサイフケータイ対応のAndroidスマートフォンでご利用可能な決済サービスです。",
            },
            {
              type: "paragraph",
              text: "あらかじめクレジットカードを登録しておけば、クレジットカード情報の入力を行うことなく、簡単・安全に決済ができます。",
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
              text: "カートに入れた時点では商品の在庫は確保されません。",
            },
            {
              type: "paragraph",
              text: "決済ページの「今すぐ支払う」をクリック後、注文完了画面が表示されましたら在庫確保となります。",
            },
            {
              type: "paragraph",
              text: "万が一、ご注文いただきました商品が在庫切れの場合、メールでお知らせ後にキャンセル処理をさせていただきます。",
            },
            { type: "subheading", text: "【入荷通知について】" },
            {
              type: "paragraph",
              text: "各製品ページの入荷通知メールにご登録頂けますと入荷次第、自動配信メールにてお知らせいたします。",
            },
            {
              type: "note",
              text: "※入荷通知に関するご注意点 ・製品の再入荷をお知らせするもので、製品の予約を承るものではございません。",
            },
            { type: "note", text: "・ご登録いただいても、再入荷がない可能性もございます。" },
            {
              type: "note",
              text: "・再入荷お知らせメール配信後、すぐに売り切れとなる可能性もございます。",
            },
            {
              type: "note",
              text: "・再入荷通知メールの配信は1回のみです。もう一度同じ製品の通知を受け取りたい場合は、あらためてご登録ください。",
            },
          ],
        },
      ],
    },
    {
      title: "返品・交換について",
      subsections: [
        {
          blocks: [
            {
              type: "subheading",
              text: "■下記に該当する場合は返品・交換をお受けできません。",
            },
            {
              type: "bullets",
              items: [
                "製品発送日から14日以上経過して返品受付された製品",
                "一度でもご使用になった場合",
                "一度でも着用された下着・靴下などの衛生商品",
                "製品タグや化粧箱、そのほか製品付属品が不足、破損している場合",
                "お客様のもとで破損、汚れが生じた場合",
                "お客様のもとで修理、加工された場合",
                "イメージと異なる、気が変わった等",
                "C AND+S公式オンラインショップ以外の店舗にてご購入いただいた場合",
              ],
            },
            { type: "subheading", text: "■返品に関するご注意点" },
            {
              type: "paragraph",
              text: "お客様都合（注文やサイズの間違いなど）による返品はクレジットカード決済のキャンセル手数料とお送りした際の送料を差し引いたご返金とさせていただきます。",
            },
            { type: "paragraph", text: "返送にかかる送料はお客様負担となります。" },
            {
              type: "paragraph",
              text: "弊社の誤送や製品に初期不良があった場合のお届けによる返送料は、弊社で負担いたします。",
            },
            { type: "subheading", text: "■交換について" },
            {
              type: "paragraph",
              text: "交換に関しましては、返品手続き後に改めてECサイトよりご購入をお願いしております。",
            },
            {
              type: "paragraph",
              text: "(在庫切れの製品につきましては返品のみのご対応となりますのでご了承ください。)",
            },
            { type: "paragraph", text: "返品手続きは下記よりお願いいたします。" },
            // TODO: 正式な返品受付フォームURLが確定したら差し替え
            { type: "link", label: "→返品受付フォーム", href: "#" },
            {
              type: "paragraph",
              text: "また、交換基準を満たさない製品については、交換及び返品はできません。",
            },
            {
              type: "paragraph",
              text: "下記は一例です。その他、弊社にて交換基準に満たないと判断した症状については、交換をお断りする場合がございます。",
            },
            { type: "paragraph", text: "予めご了承ください。" },
            {
              type: "bullets",
              items: [
                "撥水効果が落ちてきた、濡れた場合のシミ、ムラが発生する等の撥水加工に関して",
                "使用に支障がない程度の細かい傷、汚れ",
                "誤った使用による破損",
              ],
            },
            { type: "subheading", text: "初期不良について" },
            {
              type: "paragraph",
              text: "不良品および誤送があった場合、下記期限内にメールにてご連絡をお願いいたします。",
            },
            { type: "paragraph", text: "＜テント以外＞：製品到着後、14日以内" },
            {
              type: "paragraph",
              text: "＜テント・タープ・シェルター＞：製品到着後、3ヶ月以内かつ初回の使用時にお気づきの場合のみ交換のご案内をさせていただきます。",
            },
            {
              type: "paragraph",
              text: "製品の在庫状況によっては返金でのご案内をお願いする場合がございます。",
            },
            {
              type: "paragraph",
              text: "製品の初期不良に関するお問い合わせは下記専用フォームよりお問い合わせをお願い致します。",
            },
            // TODO: 正式な問い合わせフォームURLが確定したら差し替え
            {
              type: "link",
              label: "→公式オンラインショップでご購入された方はこちら",
              href: "#",
            },
            {
              type: "link",
              label: "→店舗でご購入された方はこちら",
              href: "#",
            },
            {
              type: "paragraph",
              text: "不良品および誤送に該当する場合の配送料は当社で負担させていただきます。",
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
              text: "金額が記載されたお買い上げ領収書、納品書は、お届けする製品には同梱しておりません。",
            },
            {
              type: "paragraph",
              text: "商品発送後にマイページの注文履歴ページ(ログイン必要)から領収書を発行していただくか、商品発送のお知らせメールから遷移できる注文履歴ページ(ログイン必要)から領収書の発行が可能です。",
            },
            {
              type: "note",
              text: "※領収書発行には会員登録が必要になります。",
            },
            {
              type: "note",
              text: "※領収書は発行後の宛名や但し書きの変更が出来かねますのでご了承ください。",
            },
          ],
        },
      ],
    },
    {
      title: "お問い合わせについて",
      subsections: [
        {
          blocks: [
            // TODO: 正式な問い合わせフォームURLが確定したら差し替え
            { type: "link", label: "製品に関するご質問はこちら", href: "#" },
            { type: "link", label: "初期不良に関するお問い合わせはこちら", href: "#" },
            { type: "link", label: "製品の修理に関するお問い合わせはこちら", href: "#" },
          ],
        },
      ],
    },
  ],
} as const satisfies ShoppingGuideContent;
