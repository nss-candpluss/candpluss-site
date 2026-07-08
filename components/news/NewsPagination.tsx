import Link from "next/link";

import {
  HoverUnderlineText,
  textLinkLayoutClassName,
} from "@/components/ui/TextLink";
import { arrowMaskStyle } from "@/lib/maskStyle";
import { uiText } from "@/lib/typography";

type NewsPaginationProps = {
  page: number;
  totalPages: number;
  basePath?: string;
};

function PaginationArrow({ flip = false }: { flip?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`size-[calc(24px*var(--text-scale))] shrink-0 bg-current ${
        flip ? "-scale-x-100" : ""
      }`.trim()}
      style={arrowMaskStyle}
    />
  );
}

function PaginationTextLink({
  href,
  label,
  direction,
}: {
  href: string;
  label: string;
  direction: "prev" | "next";
}) {
  return (
    <Link href={href} className={`group ${textLinkLayoutClassName}`}>
      {direction === "prev" ? (
        <>
          <PaginationArrow flip />
          <HoverUnderlineText variant="groupHover">{label}</HoverUnderlineText>
        </>
      ) : (
        <>
          <HoverUnderlineText variant="groupHover">{label}</HoverUnderlineText>
          <PaginationArrow />
        </>
      )}
    </Link>
  );
}

export function NewsPagination({
  page,
  totalPages,
  basePath = "/news",
}: NewsPaginationProps) {
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  const prevHref = page > 2 ? `${basePath}?page=${page - 1}` : basePath;
  const nextHref = `${basePath}?page=${page + 1}`;

  return (
    <nav
      aria-label="News pagination"
      className="mt-[calc(144px*var(--gap-scale-y))] grid grid-cols-[1fr_auto_1fr] items-center gap-x-[calc(16px*var(--gap-scale-x))]"
    >
      <div className="justify-self-start">
        {hasPrev ? (
          <PaginationTextLink href={prevHref} label="Prev" direction="prev" />
        ) : null}
      </div>

      <p
        className={`justify-self-center font-ui-en text-[var(--foreground)] ${uiText(14)}`}
        aria-current="page"
      >
        {page} ー {totalPages}
      </p>

      <div className="justify-self-end">
        {hasNext ? (
          <PaginationTextLink href={nextHref} label="Next" direction="next" />
        ) : null}
      </div>
    </nav>
  );
}
