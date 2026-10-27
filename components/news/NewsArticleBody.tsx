import { NewsArticleContent } from "@/components/news/NewsArticleContent";
import { NewsExhibitProducts } from "@/components/news/NewsExhibitProducts";
import { SiteImage } from "@/components/ui/SiteImage";
import type { NewsArticleBodyBlock } from "@/lib/news/types";
import { uiText } from "@/lib/typography";

function blockSpacingClassName(
  block: NewsArticleBodyBlock,
  previous: NewsArticleBodyBlock | undefined
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

type NewsArticleBodyProps = {
  body: readonly NewsArticleBodyBlock[];
  imageSizes: string;
  className?: string;
};

/** 記事の `body` を文章・見出し・画像・製品カードのブロックとして順に描画する */
export function NewsArticleBody({ body, imageSizes, className = "" }: NewsArticleBodyProps) {
  return (
    <div className={className}>
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
                sizes={imageSizes}
                className={`h-auto w-full ${spacingClassName}`}
              />
            );
          case "products":
            return (
              <div key={index} className={spacingClassName}>
                <NewsExhibitProducts items={block.items} />
              </div>
            );
        }
      })}
    </div>
  );
}
