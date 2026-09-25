import { bodyLinkUnderlineClassName, uiText } from "@/lib/typography";

/**
 * 画面を切り替えるだけの操作。「編集」「住所を追加する」など。
 * 保存や削除と違って何も起きないので、ボタンにせず下線付きの文字で置く。
 */
export const accountTextLinkClassName = `${bodyLinkUnderlineClassName} font-body-ja font-semibold text-[var(--foreground)]`;

/**
 * 会員ページの操作ボタン。
 * 入力欄の横や見出しの横に並べるので、文字の分だけの幅で置く。
 *
 * 角丸は入力欄と同じ 8px。並べたときに形が揃う。
 * 枠内の余白は共通スケールに任せず、下限を持たせる。
 * そのまま縮めると、狭い画面で文字に対して枠が細くなりすぎる。
 */
const accountButtonBaseClassName =
  `inline-flex cursor-pointer items-center justify-center rounded-[8px] px-[clamp(20px,calc(28px*var(--gap-scale-x)),28px)] py-[clamp(13px,calc(16px*var(--gap-scale-y)),16px)] font-body-ja font-semibold whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--foreground)] ${uiText(16)}`;

export const accountPrimaryButtonClassName =
  `${accountButtonBaseClassName} bg-[var(--foreground)] text-white`;

export const accountSecondaryButtonClassName =
  `${accountButtonBaseClassName} border border-[var(--foreground)] bg-white text-[var(--foreground)]`;
