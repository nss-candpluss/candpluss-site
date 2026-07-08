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

const BODY_TEXT_PX = {
  14: "text-[calc(14px*var(--text-scale))] leading-[calc(24.5px*var(--text-scale))]",
  15: "text-[calc(15px*var(--text-scale))] leading-[calc(26.25px*var(--text-scale))]",
  16: "text-[calc(16px*var(--text-scale))] leading-[calc(28px*var(--text-scale))]",
  18: "text-[calc(18px*var(--text-scale))] leading-[calc(31.5px*var(--text-scale))]",
  20: "text-[calc(20px*var(--text-scale))] leading-[calc(35px*var(--text-scale))]",
} as const;

export type UiTextSizePx = keyof typeof UI_TEXT_PX;
export type UiTextSizeRem = keyof typeof UI_TEXT_REM;
export type BodyTextSizePx = keyof typeof BODY_TEXT_PX;

/** 62px セクション見出し: 430px以下 36–42px、431px+ は 62px × text-scale */
export const sectionTitle62ClassName =
  "section-title-responsive section-title-62";

/** 67px 見出し（beginning）: 430px以下 36–42px、431px+ は 67px × text-scale */
export const sectionTitle67ClassName =
  "section-title-responsive home-beginning-title";

/** UIテキスト: font-size = line-height（Text Scale 適用） */
export function uiText(sizePx: UiTextSizePx): string {
  return UI_TEXT_PX[sizePx];
}

/** UIテキスト（rem指定） */
export function uiTextRem(sizeRem: UiTextSizeRem): string {
  return UI_TEXT_REM[sizeRem];
}

/** 本文: line-height = font-size × 1.75（20:35 比率、Text Scale 適用） */
export function bodyText(sizePx: BodyTextSizePx): string {
  return BODY_TEXT_PX[sizePx];
}
