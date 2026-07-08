import Link from "next/link";

import {
  HoverUnderlineText,
  textLinkLayoutClassName,
} from "@/components/ui/TextLink";
import { arrowMaskStyle } from "@/lib/maskStyle";
import type { NewsArticle } from "@/lib/news/types";
import { uiText } from "@/lib/typography";

type NewsDetailNavigationProps = {
  newer: NewsArticle | null;
  older: NewsArticle | null;
};

function NavigationArrow({ flip = false }: { flip?: boolean }) {
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

function AdjacentArticleLink({
  href,
  label,
  direction,
}: {
  href: string;
  label: string;
  direction: "newer" | "older";
}) {
  return (
    <Link href={href} className={`group ${textLinkLayoutClassName}`}>
      {direction === "newer" ? (
        <>
          <NavigationArrow flip />
          <HoverUnderlineText variant="groupHover">{label}</HoverUnderlineText>
        </>
      ) : (
        <>
          <HoverUnderlineText variant="groupHover">{label}</HoverUnderlineText>
          <NavigationArrow />
        </>
      )}
    </Link>
  );
}

export function NewsDetailNavigation({
  newer,
  older,
}: NewsDetailNavigationProps) {
  return (
    <nav
      aria-label="News article navigation"
      className="mt-[calc(144px*var(--gap-scale-y))] grid grid-cols-[1fr_auto_1fr] items-center gap-x-[calc(16px*var(--gap-scale-x))]"
    >
      <div className="justify-self-start">
        {newer ? (
          <AdjacentArticleLink
            href={`/news/${newer.handle}`}
            label="NEWER"
            direction="newer"
          />
        ) : null}
      </div>

      <Link
        href="/news"
        className={`group justify-self-center font-ui-en font-medium text-[var(--foreground)] ${uiText(18)}`}
      >
        <HoverUnderlineText variant="groupHover">VIEW ALL</HoverUnderlineText>
      </Link>

      <div className="justify-self-end">
        {older ? (
          <AdjacentArticleLink
            href={`/news/${older.handle}`}
            label="OLDER"
            direction="older"
          />
        ) : null}
      </div>
    </nav>
  );
}
