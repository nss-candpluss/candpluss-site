import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MaskedImage } from "@/components/ui/MaskedImage";
import { Container } from "@/components/ui/Container";
import { NewsArticleContent } from "@/components/news/NewsArticleContent";
import { NewsDetailNavigation } from "@/components/news/NewsDetailNavigation";
import {
  getAdjacentArticlesByHandle,
  getAllArticleHandles,
  getArticleByHandle,
} from "@/lib/news/articles";
import { formatNewsDate } from "@/lib/news/format";
import { resolveArticleExcerpt } from "@/lib/news/excerpt";
import { uiText } from "@/lib/typography";

type NewsDetailPageProps = {
  params: Promise<{
    handle: string;
  }>;
};

export async function generateStaticParams() {
  const handles = await getAllArticleHandles();

  return handles.map((handle) => ({ handle }));
}

export async function generateMetadata({
  params,
}: NewsDetailPageProps): Promise<Metadata> {
  const { handle } = await params;
  const article = await getArticleByHandle(handle);

  if (!article) {
    return {};
  }

  return {
    title: article.title,
    description: resolveArticleExcerpt(article),
  };
}

export default async function NewsDetailPage({ params }: NewsDetailPageProps) {
  const { handle } = await params;
  const article = await getArticleByHandle(handle);

  if (!article) {
    notFound();
  }

  const { newer, older } = await getAdjacentArticlesByHandle(handle);

  return (
    <main
      data-header-theme="onLight"
      className="pt-[var(--product-page-title-top)] pb-[var(--container-y-bottom)]"
    >
      <Container>
        <article className="mx-auto max-w-[980px]">
          <p className={`font-ui-en text-[var(--color-muted)] ${uiText(14)}`}>
            <span>{article.tag}</span>
            <span aria-hidden="true"> ｜ </span>
            <time dateTime={article.publishedAt}>{formatNewsDate(article.publishedAt)}</time>
          </p>

          <h1 className="mt-[calc(32px*var(--gap-scale-y))] font-body-ja text-[calc(32px*var(--text-scale))] leading-[calc(38px*var(--text-scale))] font-semibold text-[var(--foreground)]">
            {article.title}
          </h1>

          <MaskedImage
            src={article.image}
            alt=""
            aspectClassName="aspect-video"
            containerClassName="mt-[calc(36px*var(--gap-scale-y))] bg-[var(--color-line)]"
            sizes="(min-width: 980px) 980px, 100vw"
            priority
          />

          <NewsArticleContent
            article={article}
            className="mt-[calc(48px*var(--gap-scale-y))]"
          />

          <NewsDetailNavigation newer={newer} older={older} />
        </article>
      </Container>
    </main>
  );
}
