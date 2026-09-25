import { bodyLinkUnderlineClassName, uiText } from "@/lib/typography";

/*
  会員ページの見出し。「アカウント情報」「ご注文番号：#1025」など。
  どこを読んでいるかの目印なので、狭い画面でも縮めずに 20px で固定する。
*/
export const accountHeadingClassName =
  "font-body-ja text-[20px] leading-[20px] font-semibold text-[var(--foreground)]";

/** 見出しの中の区切り。「既定の住所」「住所1」など */
export const accountSubHeadingClassName =
  "font-body-ja text-[16px] leading-[16px] font-bold text-[var(--foreground)]";

/**
 * 画面を切り替えるだけの操作。「編集」「住所を追加する」など。
 * 保存や削除と違って何も起きないので、ボタンにせず下線付きの文字で置く。
 */
export const accountTextLinkClassName = `${bodyLinkUnderlineClassName} font-body-ja font-semibold text-[var(--foreground)]`;

/** 文章の中に置くリンク。太さは変えず、下線と色だけで示す */
export const accountBodyLinkClassName = `${bodyLinkUnderlineClassName} text-[var(--foreground)]`;

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
