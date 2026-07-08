import {
  buildColoredPhotoImageGallery,
  buildNokutaStandardGallery,
  buildOpenCloseGallery,
  buildPhotoImageGallery,
  buildPlaceholderGallery,
} from "@/data/products/builders";
import {
  buildPhotoImages,
  drawingImage,
} from "@/lib/products/image-paths";
import type { Product, ProductSizeSpec, ProductVariant } from "@/types/product";

export type {
  OpenCloseGallery,
  OpenCloseGroupId,
  Product,
  ProductCategorySlug,
  ProductFeature,
  ProductImage,
  ProductSizeSpec,
  ProductStatus,
  ProductVariant,
  StandardGallery,
  VariantGallery,
} from "@/types/product";

export { productCategories, productDetailTabs } from "@/types/product";

const COMING_SOON_STATUS = {
  status: "new" as const,
  statusLabel: "近日発売",
};

const RESERVATION_STATUS = {
  status: "available" as const,
  statusLabel: "2026/7/17予約受付開始、8/1より順次出荷予定",
  statusColor: "#9b1b30",
};

function priceYen(amount: number) {
  return {
    price: amount,
    priceLabel: `¥${amount.toLocaleString("ja-JP")}`,
  };
}

function priceTbd() {
  return {
    price: 0,
    priceLabel: "TBD",
  };
}

const ATARI_DESCRIPTION = "サンプル文章入れてください";

const MOYA500_OPTION_HANDLES = [
  "moya500-roof-sheet",
  "moya500-tpu-window",
  "moya500-ground-sheet",
  "moya500-inner-tent",
  "moya500-mesh-inner-tent",
] as const;

const ZIG_STAKE_OPTION_HANDLES = ["zig-stake20", "zig-stake30"] as const;

const GEARAID_OPTION_HANDLES = [
  "gearaid-seam-grip",
  "gearaid-sil-nylon-patch",
] as const;

const MOYA500_MAIN_OPTION_HANDLES = [
  ...MOYA500_OPTION_HANDLES,
  "nokuta",
  ...GEARAID_OPTION_HANDLES,
] as const;

const NOKUTA_OPTION_HANDLES = ["moya500"] as const;

const MOYA500_PHOTO_IMAGE_COUNT = 5;

const MOYA500_SIZE_SPEC: ProductSizeSpec = {
  specGroups: [
    {
      label: "セット内容",
      value:
        "フライシート、フラッグ×3、フレーム×6、自在付ロープ(シングル×9、ダブル×2)、鍛造ペグ×19、キャリーバッグ、収納ケース(フレーム・アップライトポール用、ルーフシート用、鍛造ペグ用)、リペアパーツ(シルナイロンパッチ、リペアパイプ)",
    },
    {
      label: "材質",
      value:
        "フライシート：70D リップストップ 両面シルナイロン / 耐水圧3000mm\nメッシュ部：20D ポリエステル\nスカート部：210D ポリエステル オックスフォード(耐水PUコーティング)/ 耐水圧2000mm\nフレーム：DAC社製 A7001 超々ジュラルミン(アルミ合金)",
    },
    {
      label: "サイズ",
      value: "収納時：W66×D35×H35cm\n設営時：W500×D433×H230cm",
    },
    {
      label: "重量",
      value: "約20kg",
    },
    {
      label: "原産国",
      value: "China",
    },
  ],
  notes: [
    "※スペック表に記載されている耐水圧は生地自体の測定値であり、縫い目やジッパー等を含めたテント全体の防水性を保証するものではありません。必要に応じて、別売のシームグリップで防水処理を施してください。",
    "※付属のリペアパーツは、フィールドでの緊急トラブルを想定した応急処置用です。安全のため、恒久的なご使用は避けてください。",
    "※ご使用前に取扱説明書を必ずよくお読みいただき、正しく安全に設営・ご使用ください。",
  ],
  drawingImage: drawingImage("moya500", "MOYA500 drawing"),
  downloads: [
    {
      label: "取扱説明書PDF",
      href: "/documents/products/moya500/manual.pdf",
    },
  ],
};

/** 図面非表示用（一時）。復活時は MOYA500_SIZE_SPEC をそのまま指定する */
const MOYA500_SIZE_SPEC_WITHOUT_DRAWING: ProductSizeSpec = {
  specGroups: MOYA500_SIZE_SPEC.specGroups,
  notes: MOYA500_SIZE_SPEC.notes,
  downloads: MOYA500_SIZE_SPEC.downloads,
};

const GEARAID_SEAM_GRIP_SIZE_SPEC: ProductSizeSpec = {
  specGroups: [
    { label: "材質", value: "シリコーンゴム" },
    { label: "内容量", value: "約44mL" },
    { label: "色", value: "透明" },
    { label: "対応素材", value: "シリコン加工（シリコーンコーティング）された生地" },
    { label: "塗布可能範囲", value: "幅約6mmで約7.3m分のシーム" },
    { label: "硬化時間", value: "3〜6時間" },
    { label: "施工時の推奨温度", value: "約16〜38℃" },
    { label: "使用可能温度", value: "約-29〜82℃" },
    { label: "保管方法", value: "涼しく乾燥した場所で保管してください。" },
    { label: "原産国", value: "USA" },
  ],
};

const GEARAID_SIL_NYLON_PATCH_SIZE_SPEC: ProductSizeSpec = {
  specGroups: [
    { label: "材質", value: "40D シリコンコーティング リップストップナイロン" },
    { label: "カラー", value: "半透明" },
    { label: "サイズ", value: "約76 × 127mm" },
    { label: "生地重量", value: "50g/㎡" },
    { label: "使用方法", value: "貼るだけ（はく離紙を剥がして貼り付け）" },
    { label: "対応素材", value: "シリコン加工生地、シルナイロン、シルポリ" },
    { label: "施工時の推奨温度", value: "室温" },
    { label: "貼り直し", value: "不可" },
    { label: "洗濯", value: "可能" },
    { label: "保管方法", value: "付属の封筒に入れて保管してください。" },
  ],
};

const MOYA500_INNER_TENT_SIZE_SPEC: ProductSizeSpec = {
  specGroups: [
    {
      label: "材質",
      value:
        "ウォール : 75D ポリエステル格子状通気性生地\nメッシュ : B3\nボトム : 210D ポリエステル オックスフォード/ 耐水圧1800mm",
    },
    {
      label: "サイズ",
      value: "収納時 : W67×D24.5×H21cm\n設営時 : W475×D433×H205cm",
    },
    {
      label: "重量",
      value: "約3.9kg",
    },
    {
      label: "原産国",
      value: "China",
    },
  ],
  drawingImage: drawingImage("moya500-inner-tent", "MOYA500 インナーテント drawing"),
};

const MOYA500_MESH_INNER_TENT_SIZE_SPEC: ProductSizeSpec = {
  specGroups: [
    {
      label: "材質",
      value:
        "メッシュ（ウォール） : 20D ポリエステルメッシュ\nボトム : 210D ポリエステル オックスフォード/ 耐水圧1800mm",
    },
    {
      label: "サイズ",
      value: "収納時 : W67×D24.5×H21cm\n設営時 : W475×D433×H205cm",
    },
    {
      label: "重量",
      value: "約2.7kg",
    },
    {
      label: "原産国",
      value: "China",
    },
  ],
  drawingImage: drawingImage("moya500-mesh-inner-tent", "MOYA500 メッシュインナーテント drawing"),
};

const MOYA500_GROUND_SHEET_SIZE_SPEC: ProductSizeSpec = {
  specGroups: [
    {
      label: "材質",
      value: "210D オックスフォード/ 耐水圧1800mm",
    },
    {
      label: "サイズ",
      value: "収納時：W50×D23×H8cm\n設営時：W500×D433cm",
    },
    {
      label: "重量",
      value: "約1.94kg",
    },
    {
      label: "原産国",
      value: "China",
    },
  ],
};

const MOYA500_ROOF_SHEET_SIZE_SPEC: ProductSizeSpec = {
  specGroups: [
    {
      label: "材質",
      value:
        "75D ポリエステル オックスフォード（ブラック全遮光 UV50+テフロン撥水処理）/ 耐水圧1800mm",
    },
    {
      label: "サイズ",
      value: "収納時：W53×D20×H80cm\n設営時：W43.5×D40.5cm",
    },
    {
      label: "重量",
      value: "約1.1kg",
    },
    {
      label: "原産国",
      value: "China",
    },
  ],
};

const ZIG_STAKE20_SIZE_SPEC: ProductSizeSpec = {
  specGroups: [
    {
      label: "サイズ",
      value: "2cm（ヘッド部1.5×0.9cm）",
    },
    {
      label: "重量",
      value: "100g",
    },
    {
      label: "素材",
      value: "スチール（S55C、カチオン黒色電着塗装）",
    },
  ],
};

const ZIG_STAKE30_SIZE_SPEC: ProductSizeSpec = {
  specGroups: [
    {
      label: "サイズ",
      value: "30cm（ヘッド部1.6×1cm）",
    },
    {
      label: "重量",
      value: "140g",
    },
    {
      label: "素材",
      value: "スチール（S55C、カチオン黒色電着塗装）",
    },
  ],
};

function atariProductSections(options?: readonly string[]) {
  return {
    description: ATARI_DESCRIPTION,
    sizeSpec: MOYA500_SIZE_SPEC,
    ...(options ? { options: [...options] } : {}),
  };
}

const MOYA500_COLOR_DEFINITIONS = [
  { id: "cy", colorCode: "cy", colorName: "CLASSIC YELLOW", swatch: "#d8b24a" },
  { id: "gb", colorCode: "gb", colorName: "GOLD BEIGE", swatch: "#b9a47a" },
  { id: "sg", colorCode: "sg", colorName: "SHADOW GRAY", swatch: "#5f6264" },
] as const;

const BLACK_RED_COLOR_DEFINITIONS = [
  { id: "black", colorCode: "black", colorName: "BLACK", swatch: "#191919" },
  { id: "red", colorCode: "red", colorName: "RED", swatch: "#9b1b30" },
] as const;

function buildMoya500ColorVariants(
  handle: string,
  title: string,
  buildGallery: (colorCode: string, colorName: string) => ProductVariant["gallery"]
): ProductVariant[] {
  return MOYA500_COLOR_DEFINITIONS.map((color) => ({
    id: color.id,
    colorCode: color.colorCode,
    colorName: color.colorName,
    swatch: color.swatch,
    shopifyVariantId: null,
    gallery: buildGallery(color.colorCode, color.colorName),
  }));
}

function buildBlackRedVariants(handle: string, title: string): ProductVariant[] {
  return BLACK_RED_COLOR_DEFINITIONS.map((color) => ({
    id: color.id,
    colorCode: color.colorCode,
    colorName: color.colorName,
    swatch: color.swatch,
    shopifyVariantId: null,
    gallery: buildPlaceholderGallery(handle, `${title} ${color.colorName}`),
  }));
}

function buildSingleVariant(
  handle: string,
  title: string,
  colorName = "DEFAULT",
  swatch = "#191919",
  gallery?: ReturnType<typeof buildPlaceholderGallery>
): ProductVariant[] {
  return [
    {
      id: "default",
      colorCode: "default",
      colorName,
      swatch,
      shopifyVariantId: null,
      gallery: gallery ?? buildPlaceholderGallery(handle, title),
    },
  ];
}

const GEARAID_SEAM_GRIP_PHOTO_IMAGE_COUNT = 5;
const GEARAID_SIL_NYLON_PATCH_PHOTO_IMAGE_COUNT = 5;
const MOYA500_GROUND_SHEET_PHOTO_IMAGE_COUNT = 2;
const MOYA500_ROOF_SHEET_PHOTO_IMAGE_COUNT = 2;
const MOYA500_TPU_WINDOW_PHOTO_IMAGE_COUNT = 1;
const MOYA500_INNER_TENT_PHOTO_IMAGE_COUNT = 3;
const MOYA500_MESH_INNER_TENT_PHOTO_IMAGE_COUNT = 3;
const ZIG_STAKE20_PHOTO_IMAGE_COUNT = 2;
const ZIG_STAKE30_PHOTO_IMAGE_COUNT = 1;

const MOYA500_VARIANTS = buildMoya500ColorVariants("moya500", "MOYA500", (colorCode, colorName) =>
  buildOpenCloseGallery({
    handle: "moya500",
    title: "MOYA500",
    colorCode,
    colorName,
  })
).map((variant, index) => ({
  ...variant,
  code:
    index === 0 ? "CDS-M50SNCY" : index === 1 ? "CDS-M50SNGB" : "CDS-M50SNSG",
}));

const NOKUTA_VARIANTS = buildMoya500ColorVariants("nokuta", "NOKUTA", (colorCode, colorName) =>
  buildNokutaStandardGallery({
    handle: "nokuta",
    title: "NOKUTA",
    colorCode,
    colorName,
  })
).map((variant) => ({
  ...variant,
  code:
    variant.colorCode === "cy"
      ? "CTP-NTPOCY"
      : variant.colorCode === "gb"
        ? "CTP-NTPOGB"
        : "CTP-NTPOSG",
}));

const MOYA500_ROOF_SHEET_VARIANTS = buildMoya500ColorVariants(
  "moya500-roof-sheet",
  "MOYA500 ルーフシート",
  (colorCode, colorName) =>
    buildColoredPhotoImageGallery({
      handle: "moya500-roof-sheet",
      title: "MOYA500 ルーフシート",
      colorCode,
      colorName,
      count: MOYA500_ROOF_SHEET_PHOTO_IMAGE_COUNT,
    })
).map((variant) => ({
  ...variant,
  code:
    variant.colorCode === "cy"
      ? "COP-RFPOM50CY"
      : variant.colorCode === "gb"
        ? "COP-RFPOM50GB"
        : "COP-RFPOM50SG",
}));

const MOYA500_TPU_WINDOW_VARIANTS = buildMoya500ColorVariants(
  "moya500-tpu-window",
  "MOYA500 TPUウインドウ",
  (colorCode, colorName) =>
    buildColoredPhotoImageGallery({
      handle: "moya500-tpu-window",
      title: "MOYA500 TPUウインドウ",
      colorCode,
      colorName,
      count: MOYA500_TPU_WINDOW_PHOTO_IMAGE_COUNT,
    })
);

export const products: Product[] = [
  {
    id: "moya500",
    handle: "moya500",
    title: "MOYA500",
    code: "CDS-M50SNCY",
    category: "テント・シェルター",
    categorySlug: "tent-shelter",
    ...priceYen(348620),
    ...RESERVATION_STATUS,
    description:
      "MOYA500は、軽量性と耐久性を両立したリップストップシルナイロン生地を採用。一般的なポリエステルPU加工生地と比べ約20%軽量で、加水分解による劣化の心配もありません。\nさらに、軽量かつ高強度を誇るDAC社製7000系ジュラルミンポールを採用し、わずか6本のポール構成で耐風性を確保。大型サイズでありながら、直感的に設営できるシンプルな構造です。\n気密性に優れたシルナイロン生地が冬場の内部環境を暖かく保ち、全面に配したメッシュパネルが夏場の通気性を確保。春夏秋冬を通して快適に使用できる、長く愛用いただけるドームシェルターです。",
    variants: MOYA500_VARIANTS,
    scrollImages: buildPhotoImages("moya500", "MOYA500", MOYA500_PHOTO_IMAGE_COUNT),
    colorKeyedFeatureImages: true,
    features: [
      {
        id: "feature-01",
        title: "軽量性と耐久性を両立するシルナイロン生地",
        body:
          "両面シリコンコーティングを施したリップストップシルナイロン生地を採用。 一般的なPU（ポリウレタン）加工のポリエステル生地と比較して、引き裂き強度に優れ、軽量でありながら高い耐久性と気密性を備えています。また、PU加工に見られる加水分解による経年劣化がなく、長期間にわたって安定した性能を維持します。",
      },
      {
        id: "feature-02",
        title: "DAC社製「超々ジュラルミン」フレーム採用",
        body:
          "圧倒的な「軽量性」と、強風にもしなやかに耐える「優れた弾力性」を高次元で両立させる、 DAC社製の「A7001 超々ジュラルミン（アルミ合金）」フレーム。 大型のMOYA500ながら、わずか6本のシンプルなフレーム構造で直感的な設営と高い耐久性を実現しています。",
      },
      {
        id: "feature-03",
        title: "Dyneema®による高耐久補強",
        body:
          "MOYA500では、最も負荷のかかるフレームフック部などの要所に高強度ファイバー「Dyneema®」を採用しています。 優れた耐切創性、耐摩耗性、UV耐性を備え、長期間にわたって安心して使用できる構造を支えています。",
      },
      {
        id: "feature-04",
        title: "開放感あふれる全15面メッシュ",
        body:
          "幅2.1m、高さ1.83mの大きな出入り口を3箇所、サイドウォール1面につき3箇所のメッシュウインドウを設置し、全15箇所の開放感あふれる空間を実現。 冬場の乾期にはフルクローズで機密性のある空間に変わります。",
      },
      {
        id: "feature-05",
        title: "冬場の冷気や風の侵入をシャットダウン",
        body:
          "MOYA500の出入り口には、左右の開閉用ジッパーに加え、下部までしっかり閉じられる下部ジッパーも備えています。\n外部スカートとインナースカート、さらに入口下部まで閉じられる構造により、シェルター内への冷気や風の侵入を効果的に抑えます。",
      },
      {
        id: "feature-06",
        title: "多用途なギアループ＆フックを多数装備",
        body:
          "MOYA500シェルター内には、合計24か所のギアループとフックを備えています。ランタンや小物などを用途に合わせて自由に取り付けられる、多用途に活躍する装備です。",
      },
      {
        id: "feature-07",
        title: "拡張性高い3箇所の出入り口",
        body:
          "幅2.1m、高さ1.83mの大きな出入り口を3か所に配置。拡張性を考えて設計された出入り口は、既存のオプションや今後展開予定の様々な製品と組み合わせることで、キャンプスタイルに合わせた自分だけの空間づくりを可能にします。",
      },
    ],
    sizeSpec: MOYA500_SIZE_SPEC,
    options: [...MOYA500_MAIN_OPTION_HANDLES],
  },
  {
    id: "moya500-roof-sheet",
    handle: "moya500-roof-sheet",
    title: "MOYA500 ルーフシート",
    code: "COP-RFPOM50CY",
    category: "テントオプション",
    categorySlug: "tent-option",
    ...priceYen(13270),
    ...COMING_SOON_STATUS,
    description:
      "MOYA500専用のルーフシート。\n夏場の強い日差しを90%以上遮るブラック遮光加工（UV50+）を施し、シェルター内の温度上昇を軽減。さらに、優れた撥水性能を備えたテフロン撥水加工により、雨天時の雨や汚れからテント本体を保護します。",
    variants: MOYA500_ROOF_SHEET_VARIANTS,
    sizeSpec: MOYA500_ROOF_SHEET_SIZE_SPEC,
    options: [...MOYA500_OPTION_HANDLES],
  },
  {
    id: "moya500-tpu-window",
    handle: "moya500-tpu-window",
    title: "MOYA500 TPUウインドウ",
    category: "テントオプション",
    categorySlug: "tent-option",
    ...priceYen(18480),
    ...RESERVATION_STATUS,
    ...atariProductSections(MOYA500_OPTION_HANDLES),
    sizeSpec: MOYA500_SIZE_SPEC_WITHOUT_DRAWING,
    description:
      "MOYA500専用のTPUウインドウ。\n冬場や夜間の冷気の侵入を抑えながら、シェルター内から開放感あふれる景色を楽しめます。\n悪天候時でも快適性を損なうことなく自然を身近に感じられる、MOYA500専用オプションです。\n最大3か所の出入り口に取り付けられるため、開放感のある空間を自由に演出できます。",
    variants: MOYA500_TPU_WINDOW_VARIANTS,
  },
  {
    id: "moya500-ground-sheet",
    handle: "moya500-ground-sheet",
    title: "MOYA500 グランドシート",
    category: "テントオプション",
    categorySlug: "tent-option",
    ...priceYen(15270),
    ...RESERVATION_STATUS,
    ...atariProductSections(MOYA500_OPTION_HANDLES),
    sizeSpec: MOYA500_GROUND_SHEET_SIZE_SPEC,
    description:
      "MOYA500専用のグランドシート。\nシェルター内の地面全体を覆う専用設計。インナースカートの上に設置するため、冷気や虫の侵入を抑え、季節を問わず快適なシェルター環境を実現します。",
    variants: buildSingleVariant(
      "moya500-ground-sheet",
      "MOYA500 グランドシート",
      "DEFAULT",
      "#191919",
      buildPhotoImageGallery(
        "moya500-ground-sheet",
        "MOYA500 グランドシート",
        MOYA500_GROUND_SHEET_PHOTO_IMAGE_COUNT
      )
    ),
  },
  {
    id: "moya500-inner-tent",
    handle: "moya500-inner-tent",
    title: "MOYA500 インナーテント",
    category: "テントオプション",
    categorySlug: "tent-option",
    ...priceYen(38700),
    ...RESERVATION_STATUS,
    options: [...MOYA500_OPTION_HANDLES],
    sizeSpec: MOYA500_INNER_TENT_SIZE_SPEC,
    description:
      "MOYA500専用のインナーテント。\n誰でも簡単に設置できる吊り下げ式を採用。通気性と肌触りに優れたポリエステル生地を使用し、快適な寝室空間とプライバシーを確保します。\nMOYA500本体に合わせて3か所のメッシュ付き出入り口を備え、シェルター内でも優れた通気性を確保します。\n別売りのグランドシートと組み合わせることで、地面からの冷気や汚れを軽減し、より快適にお使いいただけます。\nMOYA500に快適な寝室空間をつくるための専用オプションです。",
    variants: buildSingleVariant(
      "moya500-inner-tent",
      "MOYA500 インナーテント",
      "DEFAULT",
      "#191919",
      buildPhotoImageGallery(
        "moya500-inner-tent",
        "MOYA500 インナーテント",
        MOYA500_INNER_TENT_PHOTO_IMAGE_COUNT
      )
    ),
  },
  {
    id: "moya500-mesh-inner-tent",
    handle: "moya500-mesh-inner-tent",
    title: "MOYA500 メッシュインナーテント",
    category: "テントオプション",
    categorySlug: "tent-option",
    ...priceYen(27150),
    ...RESERVATION_STATUS,
    options: [...MOYA500_OPTION_HANDLES],
    sizeSpec: MOYA500_MESH_INNER_TENT_SIZE_SPEC,
    description:
      "MOYA500専用のメッシュインナーテント。\n誰でも簡単に設置できる吊り下げ式を採用。MOYA500の開放感を損なわないフルメッシュ仕様で、優れた通気性と快適な寝室空間を確保します。\n別売りのグランドシートと組み合わせることで、地面からの冷気や汚れを軽減し、さらに快適にお使いいただけます。\nMOYA500に快適な寝室空間をつくるための専用オプションです。",
    variants: buildSingleVariant(
      "moya500-mesh-inner-tent",
      "MOYA500 メッシュインナーテント",
      "DEFAULT",
      "#191919",
      buildPhotoImageGallery(
        "moya500-mesh-inner-tent",
        "MOYA500 メッシュインナーテント",
        MOYA500_MESH_INNER_TENT_PHOTO_IMAGE_COUNT
      )
    ),
  },
  {
    id: "nokuta",
    handle: "nokuta",
    title: "NOKUTA",
    code: "CTP-NTPOCY",
    category: "タープ",
    categorySlug: "tarp",
    ...priceTbd(),
    ...COMING_SOON_STATUS,
    description:
      "NOKUTAは、日差しを90%以上遮るブラック遮光加工（UV50+）を施したヘキサゴンタープです。幕下の温度上昇を抑え、夏場でも快適な空間をつくります。\nポールの本数や設営方法を変えることで、シーンやキャンプスタイルに合わせた多彩なレイアウトに対応。\nさらに、付属の連結パーツを使用することで、MOYA500との連結も簡単に行えます。",
    options: [...NOKUTA_OPTION_HANDLES],
    variants: NOKUTA_VARIANTS,
  },
  {
    id: "zig-stake20",
    handle: "zig-stake20",
    title: "ZIG STAKE20",
    code: "CDS-ZS20",
    category: "ペグ・ペグハンマー",
    categorySlug: "peg-hammer",
    ...priceYen(600),
    ...RESERVATION_STATUS,
    options: [...ZIG_STAKE_OPTION_HANDLES],
    sizeSpec: ZIG_STAKE20_SIZE_SPEC,
    description:
      "新潟県燕三条の職人が一つひとつ丁寧に仕上げた鍛造ペグ。\n曲がりや折れに強い鍛造スチールを採用。高い剛性を生むオリジナルのT字形状により、さらに曲がりにくく、打ち込みやすさと打ち込み時の回転抑制を実現しています。\nさまざまなフィールドで安心して使える20cm鍛造ペグです。",
    variants: buildSingleVariant(
      "zig-stake20",
      "ZIG STAKE20",
      "DEFAULT",
      "#191919",
      buildPhotoImageGallery("zig-stake20", "ZIG STAKE20", ZIG_STAKE20_PHOTO_IMAGE_COUNT)
    ),
  },
  {
    id: "zig-stake30",
    handle: "zig-stake30",
    title: "ZIG STAKE30",
    code: "CDS-ZS30",
    category: "ペグ・ペグハンマー",
    categorySlug: "peg-hammer",
    ...priceYen(760),
    ...RESERVATION_STATUS,
    options: [...ZIG_STAKE_OPTION_HANDLES],
    sizeSpec: ZIG_STAKE30_SIZE_SPEC,
    description:
      "新潟県燕三条の職人が一つひとつ丁寧に仕上げた鍛造ペグ。\n曲がりや折れに強い鍛造スチールを採用。高い剛性を生むオリジナルのT字形状により、さらに曲がりにくく、打ち込みやすさと打ち込み時の回転抑制を実現しています。\nより強度が求められるシーンでも安心して使える30cm鍛造ペグです。",
    variants: buildSingleVariant(
      "zig-stake30",
      "ZIG STAKE30",
      "DEFAULT",
      "#191919",
      buildPhotoImageGallery("zig-stake30", "ZIG STAKE30", ZIG_STAKE30_PHOTO_IMAGE_COUNT)
    ),
  },
  {
    id: "black-rope-3mm-15m",
    handle: "black-rope-3mm-15m",
    title: "ブラックロープ 3mm 15mカット",
    category: "アクセサリー",
    categorySlug: "accessory",
    listingHidden: true,
    ...priceYen(2420),
    ...RESERVATION_STATUS,
    ...atariProductSections(),
    description:
      "しなやかで取り回しのしやすいリフレクター入りブラックロープ。\nφ3mmの15mカットロープです。",
    variants: buildSingleVariant("black-rope-3mm-15m", "ブラックロープ 3mm 15mカット"),
  },
  {
    id: "aluminum-jammer-set",
    handle: "aluminum-jammer-set",
    title: "アルミ自在セット 6個セット",
    category: "アクセサリー",
    categorySlug: "accessory",
    listingHidden: true,
    ...priceTbd(),
    ...RESERVATION_STATUS,
    ...atariProductSections(),
    description:
      "MOYAのロープに付属している三角アルミ自在セットです。\n3つの穴に通すことでロープにかかる摩擦力が強く、2つ穴タイプに比べてロープが緩みにくく高いストッパー性能を発揮します。",
    variants: buildSingleVariant("aluminum-jammer-set", "アルミ自在セット 6個セット"),
  },
  {
    id: "zipper-tab-s",
    handle: "zipper-tab-s",
    title: "ジッパータブ S 6個セット",
    category: "アクセサリー",
    categorySlug: "accessory",
    listingHidden: true,
    ...priceTbd(),
    ...RESERVATION_STATUS,
    ...atariProductSections(),
    description:
      "お手持ちのギアなど様々なジッパーに取り付け可能なC AND+Sのロゴ入りジッパータブです。",
    variants: buildBlackRedVariants("zipper-tab-s", "ジッパータブ S 6個セット"),
  },
  {
    id: "zipper-tab-m",
    handle: "zipper-tab-m",
    title: "ジッパータブ M 6個セット",
    category: "アクセサリー",
    categorySlug: "accessory",
    listingHidden: true,
    ...priceTbd(),
    ...RESERVATION_STATUS,
    ...atariProductSections(),
    description:
      "お手持ちのギアなど様々なジッパーに取り付け可能なC AND+Sのロゴ入りジッパータブです。",
    variants: buildBlackRedVariants("zipper-tab-m", "ジッパータブ M 6個セット"),
  },
  {
    id: "gearaid-seam-grip",
    handle: "gearaid-seam-grip",
    title: "GEARAID シームグリップ+SILシリコンシーラント",
    category: "アクセサリー",
    categorySlug: "accessory",
    ...priceYen(1870),
    ...RESERVATION_STATUS,
    sizeSpec: GEARAID_SEAM_GRIP_SIZE_SPEC,
    description:
      "シルナイロン専用の補修・目止め剤。\nC AND+Sのシルナイロン製品は防水加工糸で縫製されていますが、ご利用の際はGEARAID シームグリップ+SILシリコンシーラントでシーム処理されることをおすすめします。",
    variants: buildSingleVariant(
      "gearaid-seam-grip",
      "GEARAID シームグリップ+SILシリコンシーラント",
      "DEFAULT",
      "#191919",
      buildPhotoImageGallery(
        "gearaid-seam-grip",
        "GEARAID シームグリップ+SILシリコンシーラント",
        GEARAID_SEAM_GRIP_PHOTO_IMAGE_COUNT
      )
    ),
  },
  {
    id: "gearaid-sil-nylon-patch",
    handle: "gearaid-sil-nylon-patch",
    title: "GEARAID テネシアス シルナイロンパッチ",
    category: "アクセサリー",
    categorySlug: "accessory",
    ...priceYen(1980),
    ...RESERVATION_STATUS,
    sizeSpec: GEARAID_SIL_NYLON_PATCH_SIZE_SPEC,
    description:
      "シルナイロン素材専用の強力リペアパッチです。\n穴が空いた時に素早く簡単に補修することが出来ます。C AND+Sのシルナイロン製品に貼り付けることが可能です。",
    variants: buildSingleVariant(
      "gearaid-sil-nylon-patch",
      "GEARAID テネシアス シルナイロンパッチ",
      "DEFAULT",
      "#191919",
      buildPhotoImageGallery(
        "gearaid-sil-nylon-patch",
        "GEARAID テネシアス シルナイロンパッチ",
        GEARAID_SIL_NYLON_PATCH_PHOTO_IMAGE_COUNT
      )
    ),
  },
];
