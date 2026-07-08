import Link from "next/link";
import type { ReactNode } from "react";

import { arrowMaskStyle } from "@/lib/maskStyle";
import { uiText } from "@/lib/typography";

/** Header 14px 基準（4/14 em）。font-size に比例して下線位置を揃える */
export const hoverUnderlineBaseClassName =
  "relative inline-flex after:absolute after:top-full after:left-0 after:mt-[calc(4/14*1em)] after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-current after:transition-transform after:duration-300";

export const hoverUnderlineHoverClassName = `${hoverUnderlineBaseClassName} hover:after:scale-x-100`;

export const hoverUnderlineGroupHoverClassName = `${hoverUnderlineBaseClassName} group-hover:after:scale-x-100`;

export const hoverUnderlineActiveClassName = `${hoverUnderlineBaseClassName} after:scale-x-100`;

type HoverUnderlineTextProps = {
  children: ReactNode;
  className?: string;
  variant?: "hover" | "active" | "groupHover";
};

/** テキスト + 下線アニメ（Header / TextLink / Products ナビ共通） */
export function HoverUnderlineText({
  children,
  className = "",
  variant = "hover",
}: HoverUnderlineTextProps) {
  const variantClassName =
    variant === "active"
      ? hoverUnderlineActiveClassName
      : variant === "groupHover"
        ? hoverUnderlineGroupHoverClassName
        : hoverUnderlineHoverClassName;

  return <span className={`${variantClassName} ${className}`.trim()}>{children}</span>;
}

export const textLinkLayoutClassName = `font-ui-en inline-flex items-center gap-x-[calc(8px*var(--gap-scale-x))] gap-y-[calc(8px*var(--gap-scale-y))] ${uiText(18)} font-medium`;

type TextLinkContentProps = {
  children: string;
};

/** 矢印 + テキスト + hover 下線（親に `group` が必要） */
export function TextLinkContent({ children }: TextLinkContentProps) {
  return (
    <>
      <span
        aria-hidden="true"
        className="size-[calc(24px*var(--text-scale))] shrink-0 bg-current"
        style={arrowMaskStyle}
      />
      <HoverUnderlineText variant="groupHover">{children}</HoverUnderlineText>
    </>
  );
}

type TextLinkProps = {
  href: string;
  children: string;
  className?: string;
};

export function TextLink({ href, children, className = "" }: TextLinkProps) {
  return (
    <Link
      href={href}
      className={`group ${textLinkLayoutClassName} ${className}`.trim()}
    >
      <TextLinkContent>{children}</TextLinkContent>
    </Link>
  );
}
