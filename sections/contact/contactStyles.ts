import type { ContactFieldStatus } from "@/lib/contact/field-status";
import { inputText, uiText } from "@/lib/typography";

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

export const contactFieldClassName = getContactFieldClassName("idle");

export const contactSelectClassName = getContactSelectClassName("idle");

export const contactSelectChevronStyle = {
  backgroundImage:
    "linear-gradient(45deg, transparent 50%, currentColor 50%), linear-gradient(135deg, currentColor 50%, transparent 50%)",
  backgroundSize: "6px 6px, 6px 6px",
  backgroundPosition:
    "right calc(22px * var(--gap-scale-x)) center, right calc(16px * var(--gap-scale-x)) center",
} as const;

export const contactFormSectionClassName = "mt-[calc(48px*var(--gap-scale-y))] overflow-hidden bg-[#f5f5f5]";

export const contactFormRowClassName =
  "border-b border-[var(--color-divider)] px-[calc(16px*var(--gap-scale-x))] py-[calc(24px*var(--gap-scale-y))] md:px-[calc(24px*var(--gap-scale-x))]";

export const contactPrimaryButtonClassName = `w-full cursor-pointer bg-[var(--foreground)] px-[calc(32px*var(--gap-scale-x))] py-[calc(18px*var(--gap-scale-y))] font-body-ja font-semibold text-white transition-opacity duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${uiText(16)}`;

export const contactArrowPrimaryButtonClassName = `inline-flex w-full cursor-pointer items-center justify-center gap-x-[calc(8px*var(--gap-scale-x))] bg-[var(--foreground)] px-[calc(32px*var(--gap-scale-x))] py-[calc(24px*var(--gap-scale-y))] font-body-ja font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 ${uiText(16)}`;

export const contactSecondaryButtonClassName = `w-full cursor-pointer border border-[var(--foreground)] bg-white px-[calc(32px*var(--gap-scale-x))] py-[calc(18px*var(--gap-scale-y))] font-body-ja font-semibold text-[var(--foreground)] transition-opacity duration-200 ${uiText(16)}`;

export const contactErrorClassName = `mt-[calc(8px*var(--gap-scale-y))] font-body-ja text-red-600 ${uiText(13)}`;
