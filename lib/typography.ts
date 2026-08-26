/**
 * Tailwind は動的テンプレートリテラル内のクラスを検出できないため、
 * 使用するサイズはリテラル文字列として列挙する。
 */

const UI_TEXT_PX = {
  10: "text-[calc(10px*var(--text-scale))] leading-[calc(10px*var(--text-scale))]",
  11: "text-[calc(11px*var(--text-scale))] leading-[calc(11px*var(--text-scale))]",
  13: "text-[calc(13px*var(--text-scale))] leading-[calc(13px*var(--text-scale))]",
  14: "text-[calc(14px*var(--text-scale))] leading-[calc(14px*var(--text-scale))]",
  15: "text-[calc(15px*var(--text-scale))] leading-[calc(15px*var(--text-scale))]",
  16: "text-[calc(16px*var(--text-scale))] leading-[calc(16px*var(--text-scale))]",
  18: "text-[calc(18px*var(--text-scale))] leading-[calc(18px*var(--text-scale))]",
  20: "text-[calc(20px*var(--text-scale))] leading-[calc(20px*var(--text-scale))]",
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
  "13-14":
    "text-[clamp(13px,calc(14px*var(--text-scale)),14px)] leading-[clamp(13px,calc(14px*var(--text-scale)),14px)]",
  "13-15":
    "text-[clamp(13px,calc(15px*var(--text-scale)),15px)] leading-[clamp(13px,calc(15px*var(--text-scale)),15px)]",
  "14-16":
    "text-[clamp(14px,calc(16px*var(--text-scale)),16px)] leading-[clamp(14px,calc(16px*var(--text-scale)),16px)]",
  "16-18":
    "text-[clamp(16px,calc(18px*var(--text-scale)),18px)] leading-[clamp(16px,calc(18px*var(--text-scale)),18px)]",
  "16-20":
    "text-[clamp(16px,calc(20px*var(--text-scale)),20px)] leading-[clamp(16px,calc(20px*var(--text-scale)),20px)]",
} as const;

const BODY_TEXT_PX = {
  14: "text-[calc(14px*var(--text-scale))] leading-[calc(24.5px*var(--text-scale))]",
  15: "text-[calc(15px*var(--text-scale))] leading-[calc(26.25px*var(--text-scale))]",
  16: "text-[calc(16px*var(--text-scale))] leading-[calc(28px*var(--text-scale))]",
  18: "text-[calc(18px*var(--text-scale))] leading-[calc(31.5px*var(--text-scale))]",
  20: "text-[calc(20px*var(--text-scale))] leading-[calc(35px*var(--text-scale))]",
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

/** 商品詳細セクション見出し（Feature / Size & Spec / Options）: 最大 62px、最小 46px */
export const productDetailSectionTitleClassName =
  "text-[clamp(46px,calc(32.13px+3.7vw),62px)] leading-[clamp(46px,calc(32.13px+3.7vw),62px)]";

/** UIテキスト: font-size = line-height（Text Scale 適用） */
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

/** 本文: line-height = font-size × 1.75（20:35 比率、Text Scale 適用） */
export function bodyText(sizePx: BodyTextSizePx): string {
  return BODY_TEXT_PX[sizePx];
}

/** 入力欄: Text Scale 適用、iOS ズーム防止のため 16px 未満にしない */
export function inputText(sizePx: InputTextSizePx): string {
  return INPUT_TEXT_PX[sizePx];
}
