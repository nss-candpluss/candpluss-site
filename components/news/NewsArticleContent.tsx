import Link from "next/link";

import { splitContentByInlineLinks } from "@/lib/news/inline-links";
import type { NewsArticle } from "@/lib/news/types";
import { bodyLinkUnderlineClassName } from "@/lib/typography";

const bodyClassName =
  "whitespace-pre-line font-body-ja text-[clamp(14px,calc(15px*var(--text-scale)),15px)] leading-[calc(28px*var(--text-scale))] text-[var(--foreground)]";

/** 本文末尾の導線は独立した行なので太字にする */
const contentLinkClassName = `font-semibold ${bodyLinkUnderlineClassName}`;

/** 本文中のリンクは文章の一部なので、太字にせず下線だけ付ける */
const inlineLinkClassName = bodyLinkUnderlineClassName;

function isExternalHref(href: string) {
  return href.startsWith("http://") || href.startsWith("https://");
}

type NewsArticleContentProps = {
  article: Pick<NewsArticle, "content" | "inlineLinks" | "contentLink">;
  className?: string;
};

export function NewsArticleContent({ article, className = "" }: NewsArticleContentProps) {
  const contentLink = article.contentLink;
  const segments = splitContentByInlineLinks(article.content, article.inlineLinks);

  return (
    <div className={className}>
      <p className={bodyClassName}>
        {segments.map((segment, index) => {
          if (segment.kind === "text") {
            return segment.text;
          }

          return isExternalHref(segment.href) ? (
            <a
              key={`${segment.href}-${index}`}
              href={segment.href}
              target="_blank"
              rel="noopener noreferrer"
              className={inlineLinkClassName}
            >
              {segment.text}
            </a>
          ) : (
            <Link
              key={`${segment.href}-${index}`}
              href={segment.href}
              className={inlineLinkClassName}
            >
              {segment.text}
            </Link>
          );
        })}
      </p>

      {contentLink ? (
        <p className={`${bodyClassName} mt-[calc(28px*var(--gap-scale-y))]`}>
          {isExternalHref(contentLink.href) ? (
            <a
              href={contentLink.href}
              target="_blank"
              rel="noopener noreferrer"
              className={contentLinkClassName}
            >
              {contentLink.label}
            </a>
          ) : (
            <Link href={contentLink.href} className={contentLinkClassName}>
              {contentLink.label}
            </Link>
          )}
        </p>
      ) : null}
    </div>
  );
}
