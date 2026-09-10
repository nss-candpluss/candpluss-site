import { NewsCard } from "@/components/news/NewsCard";
import { NewsPagination } from "@/components/news/NewsPagination";
import { JsonLd } from "@/components/layout/JsonLd";
import { Container } from "@/components/ui/Container";
import { SiteGrid } from "@/components/ui/SiteGrid";
import { standardCardSpanClassName } from "@/lib/layout";
import { getArticles, NEWS_LIST_PAGE_SIZE } from "@/lib/news/articles";
import { buildBreadcrumbJsonLd, pageBreadcrumb } from "@/lib/json-ld";
import { createPageMetadata } from "@/lib/site-metadata";
import { siteConfig } from "@/lib/site";
import { sectionTitle62ClassName } from "@/lib/typography";

export const metadata = createPageMetadata({
  title: "News & Topics",
  description: `${siteConfig.name}のニュース・トピックス一覧です。`,
  path: "/news",
});

export default async function NewsPage() {
  const { articles, pagination } = await getArticles({
    page: 1,
    pageSize: NEWS_LIST_PAGE_SIZE,
  });

  return (
    <main
      data-header-theme="onLight"
      className="pt-[var(--product-page-title-top)] pb-[var(--container-y-bottom)]"
    >
      <JsonLd
        data={buildBreadcrumbJsonLd(
          pageBreadcrumb([{ name: "News & Topics", path: "/news" }])
        )}
      />
      <Container>
        <h1 className={`font-heading ${sectionTitle62ClassName} text-[var(--foreground)]`}>
          News &amp; Topics
        </h1>

        <SiteGrid className="mt-[calc(98px*var(--layout-scale-y))] gap-x-[calc(16px*var(--gap-scale-x))] gap-y-[calc(62px*var(--gap-scale-y))]">
          {articles.map((article, index) => (
            <NewsCard
              key={article.id}
              article={article}
              className={standardCardSpanClassName}
              priority={index === 0}
              bodyTypographyClassName="text-[clamp(14px,calc(15px*var(--text-scale)),15px)] leading-[calc(23px*var(--text-scale))]"
            />
          ))}
        </SiteGrid>

        <NewsPagination page={pagination.page} totalPages={pagination.totalPages} />
      </Container>
    </main>
  );
}
