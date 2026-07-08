import { NewsCard } from "@/components/news/NewsCard";
import { NewsPagination } from "@/components/news/NewsPagination";
import { Container } from "@/components/ui/Container";
import { getArticles, NEWS_LIST_PAGE_SIZE } from "@/lib/news/articles";
import { sectionTitle62ClassName } from "@/lib/typography";

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
      <Container>
        <h1 className={`font-heading ${sectionTitle62ClassName} text-[var(--foreground)]`}>
          News &amp; Topics
        </h1>

        <div className="mt-[calc(98px*var(--layout-scale-y))] grid grid-cols-1 gap-x-[calc(16px*var(--gap-scale-x))] gap-y-[calc(62px*var(--gap-scale-y))] min-[768px]:grid-cols-2 min-[1024px]:grid-cols-3">
          {articles.map((article, index) => (
            <NewsCard
              key={article.id}
              article={article}
              priority={index === 0}
              bodyTypographyClassName="text-[calc(15px*var(--text-scale))] leading-[calc(23px*var(--text-scale))]"
            />
          ))}
        </div>

        <NewsPagination page={pagination.page} totalPages={pagination.totalPages} />
      </Container>
    </main>
  );
}
