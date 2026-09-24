import { uiText } from "@/lib/typography";

/**
 * 会員ページの操作ボタン。
 * 入力欄の横や見出しの横に並べるので、文字の分だけの幅で角丸にする。
 */
const accountButtonBaseClassName =
  `inline-flex cursor-pointer items-center justify-center rounded-full px-[calc(24px*var(--gap-scale-x))] py-[calc(10px*var(--gap-scale-y))] font-body-ja font-semibold whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--foreground)] ${uiText(16)}`;

export const accountPrimaryButtonClassName =
  `${accountButtonBaseClassName} bg-[var(--foreground)] text-white`;

export const accountSecondaryButtonClassName =
  `${accountButtonBaseClassName} border border-[var(--foreground)] bg-white text-[var(--foreground)]`;
