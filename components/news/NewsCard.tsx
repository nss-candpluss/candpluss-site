import { MaskedImage } from "@/components/ui/MaskedImage";
import Link from "next/link";

import { formatNewsDate } from "@/lib/news/format";
import type { NewsArticle } from "@/lib/news/types";
import { bodyText, uiText } from "@/lib/typography";

type NewsCardProps = {
  article: NewsArticle;
  className?: string;
  sizes?: string;
  priority?: boolean;
  /** 本文 typography の個別上書き（font-size / line-height） */
  bodyTypographyClassName?: string;
  /** 一覧ページは h1 直下なので 2、TOP は「News & Topics」の h2 配下なので 3 */
  headingLevel?: 2 | 3;
};

export function NewsCard({
  article,
  className = "",
  sizes = "(min-width: 768px) 33vw, 100vw",
  priority = false,
  bodyTypographyClassName,
  headingLevel = 3,
}: NewsCardProps) {
  const Heading = headingLevel === 2 ? "h2" : "h3";

  return (
    <Link href={`/news/${article.handle}`} className={`group block ${className}`.trim()}>
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

        <Heading
          className={`mt-[calc(20px*var(--gap-scale-y))] min-w-0 truncate font-body-ja font-bold text-[var(--foreground)] ${uiText(16)}`}
        >
          {article.title}
        </Heading>

        <p
          className={`mt-[calc(15px*var(--gap-scale-y))] font-body-ja line-clamp-2 whitespace-pre-line text-[var(--foreground)] ${bodyTypographyClassName ?? bodyText(15)}`}
        >
          {article.content}
        </p>
      </div>
    </Link>
  );
}
