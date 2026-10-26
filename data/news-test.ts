import type { NewsArticle, NewsArticleInlineLink } from "@/lib/news/types";

/** 展示製品などのカード。image 未設定時はグレーの枠だけを出す */
export type TestNewsProductItem = {
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

/**
 * 1 枚目は一覧と同じ `<base>.webp`、2 枚目以降は `<restBase>-02.webp` からの連番。
 * MOYA500 / MOYA420 のように 2 枚目以降を共有する商品は restBase を指定する。
 */
function productGallery(
  base: string,
  restBase: string = base,
  count: number = 5
): readonly string[] {
  return [
    `${base}.webp`,
    ...Array.from(
      { length: count - 1 },
      (_, index) => `${restBase}-${String(index + 2).padStart(2, "0")}.webp`
    ),
  ];
}

/** 詳細本文を文章・見出し・画像の順に並べるためのブロック */
export type TestNewsBodyBlock =
  | { type: "text"; content: string; inlineLinks?: readonly NewsArticleInlineLink[] }
  | { type: "heading"; text: string }
  /** 元画像の縦横比のまま全幅で表示する */
  | { type: "image"; src: string; alt: string; width: number; height: number }
  | { type: "products"; items: readonly TestNewsProductItem[] };

export type TestNewsArticle = NewsArticle & {
  /** 指定時は詳細本文を content ではなくこちらで描画する */
  body?: readonly TestNewsBodyBlock[];
};

function joinBodyText(body: readonly TestNewsBodyBlock[]): string {
  return body
    .flatMap((block) => (block.type === "text" ? [block.content] : []))
    .join("\n\n");
}

const fieldstyleExpo2026Body = [
  {
    type: "text",
    content:
      "MOYAシリーズやNOKUTAをはじめ、C AND+Sの製品を多数展示。\nまた、HOMA、NOMA、TSUGU-V、TSUGU-Mなど、MOYAシリーズ専用連結オプションの開発中プロトタイプを、FIELD STYLEで初公開します。\n空間の広がり、生地の質感、組み合わせによって変わる過ごし方。写真では伝えきれない魅力を、会場でお確かめください。",
  },
  { type: "heading", text: "展示製品" },
  {
    type: "products",
    items: [
      {
        name: "MOYA500",
        category: "大型ドームシェルター",
        image: "/images/news/news-20260918-01-moya500.webp",
        href: "/products/moya500",
        gallery: productGallery(
          "/images/news/news-20260918-01-moya500",
          "/images/news/news-20260918-01-moya"
        ),
        catchcopy: "四季を楽しむための、ひとつの答え",
        description:
          "MOYA500は、軽量性と高い耐久性を兼ね備えたリップストップシルナイロンと、優れた強度・弾力性を持つDAC製7000系ジュラルミンポールを採用。直径約5mの大型シェルターでありながら、6本のポールによる合理的なフレーム構造で、シンプルな設営と優れた耐風性を両立しました。開放的な空間と環境に応じて調整できる多彩な機能により、春の雨や夏の日差し、秋の冷え込み、冬の厳しい風まで対応。日本の移ろう四季を、快適に楽しむために設計されたドームシェルターです。",
      },
      {
        name: "MOYA420",
        category: "ドームシェルター",
        image: "/images/news/news-20260918-01-moya420.webp",
        tag: "初公開",
        href: "/products/moya420",
        gallery: productGallery(
          "/images/news/news-20260918-01-moya420",
          "/images/news/news-20260918-01-moya"
        ),
        catchcopy: "自由な時間を楽しむための、最適な空間。",
        description:
          "MOYA420は、MOYA500の機能性と美しいドーム構造を、よりコンパクトなサイズに凝縮したドームシェルターです。軽量で高耐久なリップストップシルナイロンと、優れた強度・弾力性を持つDAC製7000系ジュラルミンポールを採用。幅約4.2mのゆとりある居住空間を確保しながら、優れた携行性とスムーズな設営を実現しました。ソロでは贅沢に、デュオでは快適に。季節やフィールドを問わず、自分らしいキャンプスタイルを自由に楽しむために設計されたドームシェルターです。",
      },
      {
        name: "NOKUTA",
        category: "全遮光ヘキサタープ",
        image: "/images/news/news-20260918-01-nokuta.webp",
        tag: "初公開",
        href: "/products/nokuta",
        gallery: productGallery("/images/news/news-20260918-01-nokuta"),
        catchcopy: "空の下に、守られる場所を",
        description:
          "NOKUTAは、MOYAシリーズとの美しい連結を追求して設計されたヘキサタープです。独自のカーブラインがシェルターと自然につながり、居住空間を屋外へとシームレスに拡張。150Dポリエステルオックスフォード生地に、遮光率100%のブラックコーティング、UV50+、撥水・撥油・防汚性能を備え、強い日差しや変化する天候にも対応します。単体での使用はもちろん、片面の跳ね上げなど多彩なアレンジにも対応。MOYAと同色の専用カラーにより、機能と美しさがひとつにつながるタープです。",
      },
      {
        name: "JIG STAKE",
        category: "鍛造ペグ",
        image: "/images/news/news-20260918-01-zig-stake.webp",
        href: "/products/jig-stake",
        gallery: productGallery(
          "/images/news/news-20260918-01-zig-stake",
          "/images/news/news-20260918-01-zig-stake",
          4
        ),
        catchcopy: "大地を捉え、離さない",
        description:
          "JIG STAKEは、確かな打ち込みと保持力を追求した、燕三条製のオリジナルペグです。素材には高い強度と硬度を備えるS55Cスチールを採用。先端に向かって細くなる独自の凸型断面が硬い地面への打ち込みを助け、広い接地面によって地中でしっかりと保持します。さらに、打撃を捉えやすいワイドヘッドと大型センターホールを備え、設営・撤収時の扱いやすさにも配慮。表面にはカチオン黒色電着塗装を施し、防錆性と耐久性を高めています。燕三条の金属加工技術を、一本のペグに。",
      },
      {
        name: "HOMA",
        category: "MOYA 薪ストーブ用 拡張テント",
        image: "/images/news/news-20260918-01-homa.webp",
        tag: "参考出展",
        gallery: productGallery("/images/news/news-20260918-01-homa"),
        catchcopy: "薪ストーブのための、専用拡張スペース",
        description:
          "MOYAと連結することで、薪ストーブを設置するための専用スペースを本体の外側へ拡張。薪ストーブの設置場所をMOYAのメイン居住空間から分けることで、限られたテント内のスペースを圧迫することなく、冬のキャンプスタイルに対応します。MOYAとの接続部分から薪ストーブの配置、煙突を通す位置まで、薪ストーブとの併用を前提に設計。専用TCルーフシートと組み合わせることで、火の粉などにも配慮した冬季用の拡張システムを構成します。",
      },
      {
        name: "NOMA",
        category: "MOYA 拡張テント",
        image: "/images/news/news-20260918-01-noma.webp",
        tag: "参考出展",
        gallery: productGallery("/images/news/news-20260918-01-noma"),
        catchcopy: "MOYAに、もうひとつの空間を",
        description:
          "MOYAの居住空間を外側へ拡張し、新たな「部屋」を生み出す専用拡張テント。MOYA本体と連結することで、ひとつの大きな空間として使うだけでなく、就寝スペース、ギア収納、プライベートスペースなど、目的に応じた独立性のある空間を追加できます。人数が増えたとき。荷物が増えたとき。あるいは、過ごし方を分けたいとき。キャンプスタイルに合わせて必要な空間を必要なだけ追加する。MOYAシリーズが持つ自由な拡張性を、さらに広げるための専用オプションです。",
      },
      {
        name: "TSUGU-V",
        category: "MOYA to CAR 連結テント",
        image: "/images/news/news-20260918-01-tsugu-v.webp",
        tag: "参考出展",
        gallery: productGallery("/images/news/news-20260918-01-tsugu-v"),
        catchcopy: "車両まで、MOYAの空間に",
        description:
          "TSUGU-VはMOYA500と車両を繋ぎ、キャンプサイトの空間をさらに広げる専用コネクションモジュールです。MOYA500とは専用ジッパーでダイレクトに接続し、反対側を車両のサイドまたはリアへ連結。車内とMOYAの間にひとつの空間をつくることで、荷物の出し入れや車内へのアクセスをスムーズにし、車両そのものをMOYA500の拡張スペースとして活用できます。MOYA500と同じシルナイロンを使用し、専用フレームや車高に対応する調整機構、2箇所の出入口などを搭載。テントと車両。それぞれの空間を繋ぎ、フィールドでの過ごし方をさらに自由にするための専用モジュールです。",
      },
      {
        name: "TSUGU-M",
        category: "MOYA to MOYA 連結テント",
        image: "/images/news/news-20260918-01-tsugu-m.webp",
        tag: "参考出展",
        gallery: productGallery("/images/news/news-20260918-01-tsugu-m"),
        catchcopy: "MOYAどうしを繋ぎ、空間をひとつに",
        description:
          "2つのMOYAを接続し、それぞれの居住空間をひとつに繋ぐ専用コネクションモジュール。両端をMOYAの開口部へ専用ジッパーでダイレクトに連結することで、それぞれのMOYAを行き来できる動線を形成します。リビングと寝室。大人と子ども。仲間同士。それぞれの空間を分けながら、必要なときにはひとつに繋がる。単純にテントの面積を広げるのではなく、人数やシーンに合わせて、フィールドでの過ごし方をさらに自由にするための専用モジュールです。",
      },
    ],
  },
  { type: "heading", text: "展示ブース｜ホール C/259" },
  {
    type: "image",
    src: "/images/news/news-20260918-01-fieldstyle2026-map.webp",
    alt: "FIELDSTYLE EXPO 2026 屋内エリアMAP。C AND+S のブースはホール C の 259 番",
    width: 2458,
    height: 1560,
  },
  { type: "heading", text: "開催概要" },
  {
    type: "text",
    content:
      "■FIELDSTYLE EXPO 2026\n■開催日時：2026年11月14日（土）〜15日（日）9:00〜17:00\n■会場：AICHI SKY EXPO（愛知国際展示場）\n■URL：https://field-style.jp/",
    inlineLinks: [{ text: "https://field-style.jp/", href: "https://field-style.jp/" }],
  },
] as const satisfies readonly TestNewsBodyBlock[];

/**
 * 公開中の記事を修正する前の確認用データ。
 * `newsItems` には含めないため、一覧・TOP・sitemap には出ない。
 * 表示先: /shopify-test/news/[handle]
 */
export const testNewsItems = [
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
    content: joinBodyText(fieldstyleExpo2026Body),
    body: fieldstyleExpo2026Body,
  },
] as const satisfies readonly TestNewsArticle[];
