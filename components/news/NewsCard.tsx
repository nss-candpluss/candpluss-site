import { MaskedImage } from "@/components/ui/MaskedImage";
import Link from "next/link";

import { formatNewsDate } from "@/lib/news/format";
import type { NewsArticle } from "@/lib/news/types";
import { bodyText, uiText } from "@/lib/typography";

type NewsCardProps = {
  article: NewsArticle;
  sizes?: string;
  priority?: boolean;
  /** 本文 typography の個別上書き（font-size / line-height） */
  bodyTypographyClassName?: string;
};

export function NewsCard({
  article,
  sizes = "(min-width: 768px) 33vw, 100vw",
  priority = false,
  bodyTypographyClassName,
}: NewsCardProps) {
  return (
    <Link href={`/news/${article.handle}`} className="group block">
      <MaskedImage
        src={article.image}
        alt=""
        aspectClassName="aspect-[13/10]"
        containerClassName="bg-[var(--color-line)]"
        imageClassName="transition-transform duration-300 ease-out group-hover:scale-105"
        sizes={sizes}
        priority={priority}
      />

      <div className="mt-[calc(22px*var(--gap-scale-y))] flex flex-col px-[calc(8px*var(--gap-scale-x))]">
        <p className={`font-ui-en text-[var(--color-muted)] ${uiText(14)}`}>
          <span>{article.tag}</span>
          <span aria-hidden="true"> ｜ </span>
          <time dateTime={article.publishedAt}>{formatNewsDate(article.publishedAt)}</time>
        </p>

        <h3
          className={`mt-[calc(20px*var(--gap-scale-y))] min-w-0 truncate font-body-ja font-bold text-[var(--foreground)] ${uiText(16)}`}
        >
          {article.title}
        </h3>

        <p
          className={`mt-[calc(15px*var(--gap-scale-y))] font-body-ja line-clamp-2 whitespace-pre-line text-[var(--foreground)] ${bodyTypographyClassName ?? bodyText(15)}`}
        >
          {article.content}
        </p>
      </div>
    </Link>
  );
}
