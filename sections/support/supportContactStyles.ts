import { uiText } from "@/lib/typography";

export const supportContactButtonClassName =
  `font-body-ja inline-flex w-full items-center justify-center gap-x-[calc(8px*var(--gap-scale-x))] gap-y-[calc(8px*var(--gap-scale-y))] bg-[var(--foreground)] px-[calc(32px*var(--gap-scale-x))] py-[calc(32px*var(--layout-scale-y))] font-semibold text-white min-[1025px]:py-[calc(18px*var(--gap-scale-y))] ${uiText(16)}`;

export const supportContactSecondaryButtonClassName =
  `font-body-ja inline-flex w-full items-center justify-center gap-x-[calc(8px*var(--gap-scale-x))] gap-y-[calc(8px*var(--gap-scale-y))] border border-[var(--foreground)] bg-white px-[calc(32px*var(--gap-scale-x))] py-[calc(32px*var(--layout-scale-y))] font-semibold text-[var(--foreground)] min-[1025px]:py-[calc(18px*var(--gap-scale-y))] ${uiText(16)}`;

const supportSerialFieldActionButtonBaseClassName =
  "relative size-[calc(32px*var(--text-scale))] shrink-0 cursor-pointer rounded-full border border-[var(--foreground)] bg-white text-[var(--foreground)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--foreground)] before:absolute before:top-1/2 before:left-1/2 before:h-px before:w-[calc(14px*var(--text-scale))] before:-translate-x-1/2 before:-translate-y-1/2 before:bg-current before:content-['']";

export const supportSerialFieldAddButtonClassName =
  `${supportSerialFieldActionButtonBaseClassName} after:absolute after:top-1/2 after:left-1/2 after:h-[calc(14px*var(--text-scale))] after:w-px after:-translate-x-1/2 after:-translate-y-1/2 after:bg-current after:content-['']`;

export const supportSerialFieldRemoveButtonClassName =
  supportSerialFieldActionButtonBaseClassName;
