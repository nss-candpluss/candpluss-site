import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MaskedImage } from "@/components/ui/MaskedImage";
import { Container } from "@/components/ui/Container";
import { SiteImage } from "@/components/ui/SiteImage";
import { NewsArticleContent } from "@/components/news/NewsArticleContent";
import { NewsDetailNavigation } from "@/components/news/NewsDetailNavigation";
import {
  testNewsItems,
  type TestNewsArticle,
  type TestNewsBodyBlock,
} from "@/data/news-test";
import { getAdjacentArticlesByHandle } from "@/lib/news/articles";
import { formatNewsDate } from "@/lib/news/format";
import { getNewsOgImage } from "@/lib/news/og-image";
import { resolveArticleExcerpt } from "@/lib/news/excerpt";
import { createPageMetadata } from "@/lib/site-metadata";
import { uiText } from "@/lib/typography";

import { ExhibitProducts } from "./ExhibitProducts";

type PreviewNewsDetailPageProps = {
  params: Promise<{
    handle: string;
  }>;
};

const mainImageSizes = "(min-width: 980px) 980px, 100vw";

function getTestArticleByHandle(handle: string): TestNewsArticle | null {
  return testNewsItems.find((item) => item.handle === handle) ?? null;
}

function blockSpacingClassName(
  block: TestNewsBodyBlock,
  previous: TestNewsBodyBlock | undefined
): string {
  if (!previous) {
    return "";
  }

  if (block.type === "heading") {
    return "mt-[calc(100px*var(--gap-scale-y))]";
  }

  if (previous.type === "heading") {
    return "mt-[calc(40px*var(--gap-scale-y))]";
  }

  return "mt-[calc(48px*var(--gap-scale-y))]";
}

function TestNewsBody({ body }: { body: readonly TestNewsBodyBlock[] }) {
  return (
    <div className="mt-[calc(48px*var(--gap-scale-y))]">
      {body.map((block, index) => {
        const spacingClassName = blockSpacingClassName(block, body[index - 1]);

        switch (block.type) {
          case "text":
            return (
              <NewsArticleContent key={index} article={block} className={spacingClassName} />
            );
          case "heading":
            return (
              <h2
                key={index}
                className={`font-body-ja font-semibold text-[var(--foreground)] ${uiText(24)} ${spacingClassName}`}
              >
                {block.text}
              </h2>
            );
          case "image":
            return (
              <SiteImage
                key={index}
                src={block.src}
                alt={block.alt}
                width={block.width}
                height={block.height}
                sizes={mainImageSizes}
                className={`h-auto w-full ${spacingClassName}`}
              />
            );
          case "products":
            return (
              <div key={index} className={spacingClassName}>
                <ExhibitProducts items={block.items} />
              </div>
            );
        }
      })}
    </div>
  );
}

/**
 * 公開ページの `/news/[handle]` と同じ構成にする。違いは次の 3 点だけ。
 * - 記事は `data/news-test.ts` から読む（公開中の記事を変えずに修正を確認する）。
 *   `body` があれば本文を見出し・画像・製品カード入りのブロックで描画する
 * - 構造化データを出さない（検索対象にしない領域なので不要）
 * - noindex を返す
 *
 * 前後の記事ナビは公開ページと同じ並びを出すため、公開側の記事データから引く。
 */
export async function generateMetadata({
  params,
}: PreviewNewsDetailPageProps): Promise<Metadata> {
  const { handle } = await params;
  const article = getTestArticleByHandle(handle);

  if (!article) {
    return {};
  }

  return createPageMetadata({
    title: `${article.title}（テスト）`,
    description: resolveArticleExcerpt(article),
    path: `/preview/news/${handle}`,
    image: getNewsOgImage(article),
    ogType: "article",
    index: false,
  });
}

export default async function PreviewNewsDetailPage({
  params,
}: PreviewNewsDetailPageProps) {
  const { handle } = await params;
  const article = getTestArticleByHandle(handle);

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
            alt={article.imageAlt ?? ""}
            aspectClassName="aspect-video"
            containerClassName="mt-[calc(36px*var(--gap-scale-y))] bg-[var(--color-line)]"
            sizes={mainImageSizes}
            priority
          />

          {article.body ? (
            <TestNewsBody body={article.body} />
          ) : (
            <NewsArticleContent
              article={article}
              className="mt-[calc(48px*var(--gap-scale-y))]"
            />
          )}

          <NewsDetailNavigation newer={newer} older={older} />
        </article>
      </Container>
    </main>
  );
}
