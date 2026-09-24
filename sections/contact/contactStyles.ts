import type { CSSProperties } from "react";

import type { ContactFieldStatus } from "@/lib/contact/field-status";
import { bodyText, inputText, uiText } from "@/lib/typography";

const contactFieldBaseClassName =
  `w-full border bg-white px-[calc(16px*var(--gap-scale-x))] py-[calc(14px*var(--gap-scale-y))] font-body-ja ${inputText(15)} text-[var(--foreground)] outline-none transition-colors duration-200`;

const contactFieldBorderByStatus: Record<ContactFieldStatus, string> = {
  idle: "border-[var(--color-divider)] focus:border-[var(--foreground)]",
  valid: "border-green-600 focus:border-green-600",
  invalid: "border-red-600 focus:border-red-600",
};

export function getContactFieldClassName(status: ContactFieldStatus = "idle"): string {
  return `${contactFieldBaseClassName} ${contactFieldBorderByStatus[status]}`;
}

export function getContactSelectClassName(status: ContactFieldStatus = "idle"): string {
  return `${getContactFieldClassName(status)} appearance-none bg-[length:16px_16px] bg-[right_calc(16px*var(--gap-scale-x))]_center bg-no-repeat pr-[calc(40px*var(--gap-scale-x))]`;
}

/** フローティング入力欄と高さ・角丸を揃えたセレクト。会員の住所更新でも使う */
export function getContactFloatingSelectClassName(
  status: ContactFieldStatus = "idle"
): string {
  return `${getContactSelectClassName(status)} rounded-[8px] pl-[clamp(12px,calc(20px*var(--gap-scale-x)),20px)] pt-[clamp(12px,calc(20px*var(--gap-scale-y)),20px)] pb-[clamp(10px,calc(16px*var(--gap-scale-y)),16px)]`;
}

/** 未選択のときだけ細字にして、プレースホルダーのように見せる */
export function getContactFloatingSelectStyle(hasValue: boolean): CSSProperties {
  return {
    color: "var(--foreground)",
    fontSize: "16px",
    lineHeight: "1.3",
    fontWeight: hasValue ? 600 : 400,
    minHeight:
      "calc(26px + clamp(12px, calc(20px * var(--gap-scale-y)), 20px) + clamp(10px, calc(16px * var(--gap-scale-y)), 16px))",
  };
}

/** セレクト右端の山形。position: relative な親の中に置く */
export const contactSelectChevronClassName =
  "pointer-events-none absolute top-1/2 right-[clamp(14px,calc(20px*var(--gap-scale-x)),20px)] size-[calc(10px*var(--text-scale))] -translate-y-[70%] rotate-45 border-r border-b border-[var(--foreground)]";

/**
 * お問い合わせフォームのチェックボックスの見た目。
 * 実際の input は `peer sr-only` で隠し、直後の span にこれを当てる。
 */
export const contactCheckboxBoxClassName =
  "relative size-[max(24px,calc(24px*var(--text-scale)))] shrink-0 rounded-[calc(5px*var(--text-scale))] border border-[var(--color-divider)] bg-white transition-colors after:absolute after:top-[calc(50%-1px)] after:left-1/2 after:h-[58%] after:w-[30%] after:-translate-x-1/2 after:-translate-y-1/2 after:rotate-45 after:border-r-[2px] after:border-b-[2px] after:border-white after:opacity-0 after:content-[''] peer-checked:border-[var(--foreground)] peer-checked:bg-[var(--foreground)] peer-checked:after:opacity-100 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--foreground)]";

export function getContactCheckboxClassName(status: ContactFieldStatus = "idle"): string {
  const base =
    "mt-[calc(4px*var(--gap-scale-y))] size-[calc(16px*var(--text-scale))] shrink-0 accent-[var(--foreground)]";

  if (status === "valid") {
    return `${base} outline outline-2 outline-offset-2 outline-green-600`;
  }

  if (status === "invalid") {
    return `${base} outline outline-2 outline-offset-2 outline-red-600`;
  }

  return base;
}

export function getContactRadioClassName(status: ContactFieldStatus = "idle"): string {
  const base =
    "size-[max(24px,calc(24px*var(--text-scale)))] shrink-0 appearance-none rounded-full border border-[var(--color-divider)] bg-white transition-colors duration-200 checked:border-[var(--foreground)] checked:[border-width:calc(7px*var(--text-scale))] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--foreground)]";

  if (status === "invalid") {
    return `${base} outline outline-2 outline-offset-2 outline-red-600`;
  }

  return base;
}

export const contactInquiryTitleClassName = `font-body-ja font-bold text-[var(--foreground)] ${uiText(20)}`;

export const contactInquiryBodyClassName = `font-body-ja text-[var(--foreground)] ${bodyText(15)}`;

export const contactInquiryBodyWrapClassName =
  "mt-[calc(24px*var(--gap-scale))] flex flex-col gap-[calc(24px*var(--gap-scale-y))]";

export const contactConfirmSectionClassName =
  "mt-[calc(48px*var(--gap-scale-y))] overflow-hidden border border-[var(--color-divider)] bg-white px-[clamp(20px,calc(48px*var(--gap-scale-x)),48px)] [&>div:first-child]:pt-[clamp(20px,calc(48px*var(--gap-scale-x)),48px)] [&>div:last-child]:pb-[clamp(20px,calc(48px*var(--gap-scale-x)),48px)]";

export const contactTitleToContentGapClassName =
  "mt-[clamp(14px,calc(18px*var(--gap-scale-y)),18px)]";

export const contactConfirmLabelClassName =
  "font-body-ja text-[16px] leading-[16px] font-bold text-[var(--foreground)]";

export const contactConfirmValueClassName =
  "font-body-ja whitespace-pre-line text-[16px] leading-[1.3] text-[var(--foreground)]";

export const contactConfirmRowClassName =
  "border-b border-[var(--color-divider)] [padding-block:calc(42px*var(--gap-scale-y))] last:border-b-0";

export const contactFormRowClassName =
  "border-b border-[var(--color-divider)] px-[calc(16px*var(--gap-scale-x))] py-[calc(24px*var(--gap-scale-y))] md:px-[calc(24px*var(--gap-scale-x))]";

/** 問い合わせフォームの外枠 */
export const contactFormShellClassName =
  "border border-[var(--color-divider)] [&>div]:border-b-0 [&>div]:px-[clamp(20px,calc(48px*var(--gap-scale-x)),48px)] [&>div]:py-[clamp(12px,calc(24px*var(--gap-scale-y)),24px)] [&>div:first-child]:pt-[clamp(20px,calc(48px*var(--gap-scale-x)),48px)] [&>div:last-child]:pb-[clamp(20px,calc(48px*var(--gap-scale-x)),48px)] [&>div>div:first-child>span]:hidden";

export const contactArrowPrimaryButtonClassName = `inline-flex w-full cursor-pointer items-center justify-center gap-x-[calc(8px*var(--gap-scale-x))] bg-[var(--foreground)] px-[calc(32px*var(--gap-scale-x))] py-[calc(24px*var(--gap-scale-y))] font-body-ja font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 ${uiText(16)}`;

export const contactErrorClassName = `mt-[calc(8px*var(--gap-scale-y))] font-body-ja text-red-600 ${uiText(13)}`;
