import Link from "next/link";

import type { NewsArticle } from "@/lib/news/types";

const bodyClassName =
  "whitespace-pre-line font-body-ja text-[clamp(14px,calc(15px*var(--text-scale)),15px)] leading-[calc(28px*var(--text-scale))] text-[var(--foreground)]";

const contentLinkClassName =
  "font-semibold underline decoration-solid underline-offset-[calc(4/15*1em)]";

function isExternalHref(href: string) {
  return href.startsWith("http://") || href.startsWith("https://");
}

type NewsArticleContentProps = {
  article: Pick<NewsArticle, "content" | "contentLink">;
  className?: string;
};

export function NewsArticleContent({ article, className = "" }: NewsArticleContentProps) {
  const contentLink = article.contentLink;

  return (
    <div className={className}>
      <p className={bodyClassName}>{article.content}</p>

      {contentLink ? (
        <p className={`${bodyClassName} mt-[calc(28px*var(--gap-scale-y))]`}>
          {isExternalHref(contentLink.href) ? (
            <a
              href={contentLink.href}
              target="_blank"
              rel="noreferrer"
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
