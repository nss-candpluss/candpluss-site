/**
 * Tailwind は動的テンプレートリテラル内のクラスを検出できないため、
 * 使用するサイズはリテラル文字列として列挙する。
 *
 * 11–20px の font-size 下限:
 * - 11px → 固定 11px
 * - 12px → 最小 11px
 * - 13px → 最小 12px
 * - 14px → 最小 13px
 * - 15px → 最小 14px
 * - 16px → 最小 15px
 * - 18px → 最小 16px
 * - 20px → 最小 18px
 * line-height の比率（UI は 1:1、本文は ×1.75）は変えない。
 */

const UI_TEXT_PX = {
  10: "text-[calc(10px*var(--text-scale))] leading-[calc(10px*var(--text-scale))]",
  11: "text-[11px] leading-[11px]",
  12: "text-[clamp(11px,calc(12px*var(--text-scale)),12px)] leading-[clamp(11px,calc(12px*var(--text-scale)),12px)]",
  13: "text-[clamp(12px,calc(13px*var(--text-scale)),13px)] leading-[clamp(12px,calc(13px*var(--text-scale)),13px)]",
  14: "text-[clamp(13px,calc(14px*var(--text-scale)),14px)] leading-[clamp(13px,calc(14px*var(--text-scale)),14px)]",
  15: "text-[clamp(14px,calc(15px*var(--text-scale)),15px)] leading-[clamp(14px,calc(15px*var(--text-scale)),15px)]",
  16: "text-[clamp(15px,calc(16px*var(--text-scale)),16px)] leading-[clamp(15px,calc(16px*var(--text-scale)),16px)]",
  18: "text-[clamp(16px,calc(18px*var(--text-scale)),18px)] leading-[clamp(16px,calc(18px*var(--text-scale)),18px)]",
  20: "text-[clamp(18px,calc(20px*var(--text-scale)),20px)] leading-[clamp(18px,calc(20px*var(--text-scale)),20px)]",
  21: "text-[calc(21px*var(--text-scale))] leading-[calc(21px*var(--text-scale))]",
  24: "text-[calc(24px*var(--text-scale))] leading-[calc(24px*var(--text-scale))]",
  30: "text-[calc(30px*var(--text-scale))] leading-[calc(30px*var(--text-scale))]",
  32: "text-[calc(32px*var(--text-scale))] leading-[calc(32px*var(--text-scale))]",
  62: "text-[calc(62px*var(--text-scale))] leading-[calc(62px*var(--text-scale))]",
  67: "text-[calc(67px*var(--text-scale))] leading-[calc(67px*var(--text-scale))]",
  72: "text-[calc(72px*var(--text-scale))] leading-[calc(72px*var(--text-scale))]",
  108: "text-[calc(108px*var(--text-scale))] leading-[calc(108px*var(--text-scale))]",
} as const;

const UI_TEXT_REM = {
  2.25: "text-[calc(2.25rem*var(--text-scale))] leading-[calc(2.25rem*var(--text-scale))]",
  2.75: "text-[calc(2.75rem*var(--text-scale))] leading-[calc(2.75rem*var(--text-scale))]",
} as const;

const UI_TEXT_RANGE_PX = {
  "11-12":
    "text-[clamp(11px,calc(12px*var(--text-scale)),12px)] leading-[clamp(11px,calc(12px*var(--text-scale)),12px)]",
  "12-13":
    "text-[clamp(12px,calc(13px*var(--text-scale)),13px)] leading-[clamp(12px,calc(13px*var(--text-scale)),13px)]",
  "13-14":
    "text-[clamp(13px,calc(14px*var(--text-scale)),14px)] leading-[clamp(13px,calc(14px*var(--text-scale)),14px)]",
  "14-15":
    "text-[clamp(14px,calc(15px*var(--text-scale)),15px)] leading-[clamp(14px,calc(15px*var(--text-scale)),15px)]",
  "15-16":
    "text-[clamp(15px,calc(16px*var(--text-scale)),16px)] leading-[clamp(15px,calc(16px*var(--text-scale)),16px)]",
  "16-18":
    "text-[clamp(16px,calc(18px*var(--text-scale)),18px)] leading-[clamp(16px,calc(18px*var(--text-scale)),18px)]",
  "18-20":
    "text-[clamp(18px,calc(20px*var(--text-scale)),20px)] leading-[clamp(18px,calc(20px*var(--text-scale)),20px)]",
} as const;

const BODY_TEXT_PX = {
  14: "text-[clamp(13px,calc(14px*var(--text-scale)),14px)] leading-[calc(24.5px*var(--text-scale))]",
  15: "text-[clamp(14px,calc(15px*var(--text-scale)),15px)] leading-[calc(26.25px*var(--text-scale))]",
  16: "text-[clamp(15px,calc(16px*var(--text-scale)),16px)] leading-[calc(28px*var(--text-scale))]",
  18: "text-[clamp(16px,calc(18px*var(--text-scale)),18px)] leading-[calc(31.5px*var(--text-scale))]",
  20: "text-[clamp(18px,calc(20px*var(--text-scale)),20px)] leading-[calc(35px*var(--text-scale))]",
} as const;

/** iOS Safari は計算後 16px 未満の入力欄をフォーカスするとズームするため、下限を 16px にする */
const INPUT_TEXT_PX = {
  14: "text-[max(16px,calc(14px*var(--text-scale)))] leading-[max(16px,calc(14px*var(--text-scale)))]",
  15: "text-[max(16px,calc(15px*var(--text-scale)))]",
  16: "text-[max(16px,calc(16px*var(--text-scale)))] leading-[max(16px,calc(16px*var(--text-scale)))]",
} as const;

export type UiTextSizePx = keyof typeof UI_TEXT_PX;
export type UiTextSizeRem = keyof typeof UI_TEXT_REM;
export type UiTextRangePx = keyof typeof UI_TEXT_RANGE_PX;
export type BodyTextSizePx = keyof typeof BODY_TEXT_PX;
export type InputTextSizePx = keyof typeof INPUT_TEXT_PX;

/** 62px セクション見出し: 430px以下 36–42px、431px+ は 62px × text-scale */
export const sectionTitle62ClassName =
  "section-title-responsive section-title-62";

/** 67px 見出し（beginning）: 430px以下 36–42px、431px+ は 67px × text-scale */
export const sectionTitle67ClassName =
  "section-title-responsive home-beginning-title";

/** Concept 見出し数字: 375px → 32px、1440px+ → 48px（32px未満にしない）
 *  line-height は Baskervville SC の数字インク高（約 0.48em）。
 *  -0.116em で、小さい数字をタイトルの大文字中心より約 1px 下へ光学補正する。
 */
export const conceptHeadingNumeralClassName =
  "text-[clamp(32px,calc(32px+(100vw-375px)/(1440px-375px)*16px),48px)] leading-[0.48em] -translate-y-[0.116em]";

/** Concept 見出し英字の上部余白: 375px → 12px、1440px+ → 18px（12px未満にしない） */
export const conceptHeadingEnglishGapClassName =
  "mt-[clamp(12px,calc(12px+(100vw-375px)/(1440px-375px)*6px),18px)]";

/** Concept 英字見出し: 375px → 46px、1440px+ → 92px */
export const conceptStoryTitleClassName =
  "text-[clamp(46px,calc(29.8px+4.32vw),92px)] leading-[clamp(46px,calc(29.8px+4.32vw),92px)]";

/** Concept 本文: 18px / 36px（共通本文 18/31.5 より行間を少し広げる） */
export const conceptStoryBodyClassName =
  "text-[clamp(16px,calc(18px*var(--text-scale)),18px)] leading-[calc(36px*var(--text-scale))]";

/** 商品詳細セクション見出し（Feature / Size & Spec / Options）: 最大 62px、最小 46px */
export const productDetailSectionTitleClassName =
  "text-[clamp(46px,calc(32.13px+3.7vw),62px)] leading-[clamp(46px,calc(32.13px+3.7vw),62px)]";

/** Feature 本文上タイトル / 商品説明タイトル */
export const productFeatureItemTitleClassName =
  "min-w-0 font-body-ja text-[clamp(16px,calc(18px*var(--text-scale)),18px)] leading-[clamp(22px,calc(26px*var(--text-scale)),26px)] font-bold text-[var(--foreground)]";

/** UIテキスト: font-size = line-height（Text Scale 適用、11–20px は下限あり） */
export function uiText(sizePx: UiTextSizePx): string {
  return UI_TEXT_PX[sizePx];
}

/** UIテキスト（最小〜最大。Text Scale、最小値未満にはしない） */
export function uiTextRange(rangePx: UiTextRangePx): string {
  return UI_TEXT_RANGE_PX[rangePx];
}

/** UIテキスト（rem指定） */
export function uiTextRem(sizeRem: UiTextSizeRem): string {
  return UI_TEXT_REM[sizeRem];
}

/** 本文: line-height = font-size × 1.75（20:35 比率、Text Scale 適用。font-size のみ 11–20px 下限） */
export function bodyText(sizePx: BodyTextSizePx): string {
  return BODY_TEXT_PX[sizePx];
}

/** 入力欄: Text Scale 適用、iOS ズーム防止のため 16px 未満にしない */
export function inputText(sizePx: InputTextSizePx): string {
  return INPUT_TEXT_PX[sizePx];
}
