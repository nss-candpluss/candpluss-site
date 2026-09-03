import { NewsCard } from "@/components/news/NewsCard";
import { Container } from "@/components/ui/Container";
import { SiteGrid } from "@/components/ui/SiteGrid";
import { TextLink } from "@/components/ui/TextLink";
import { standardCardSpanClassName } from "@/lib/layout";
import { getLatestArticles, HOME_NEWS_DISPLAY_LIMIT } from "@/lib/news/articles";
import { sectionTitle62ClassName } from "@/lib/typography";

export async function HomeNews() {
  const articles = await getLatestArticles(HOME_NEWS_DISPLAY_LIMIT);

  return (
    <section data-header-theme="onLight" className="bg-[#f5f5f5] pt-[var(--container-y-top)] pb-[var(--container-y-bottom)]">
      <Container>
        <h2 className={`font-heading ${sectionTitle62ClassName} text-[var(--foreground)]`}>
          News &amp; Topics
        </h2>

        <SiteGrid className="mt-[calc(98px*var(--layout-scale-y))] gap-x-[calc(16px*var(--gap-scale-x))] gap-y-[calc(62px*var(--gap-scale-y))] min-[1024px]:gap-y-[calc(16px*var(--gap-scale-y))]">
          {articles.map((article, index) => (
            <NewsCard
              key={article.id}
              article={article}
              className={standardCardSpanClassName}
              priority={index === 0}
              bodyTypographyClassName="text-[calc(15px*var(--text-scale))] leading-[calc(23px*var(--text-scale))]"
            />
          ))}
        </SiteGrid>

        <div className="mt-[calc(60px*var(--gap-scale-y))]">
          <TextLink href="/news">VIEW ALL</TextLink>
        </div>
      </Container>
    </section>
  );
}
