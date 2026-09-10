import type { MetadataRoute } from "next";

import { newsArticleSource } from "@/lib/news/source";
import { getListingProducts } from "@/lib/products";
import { buildSitemapEntries } from "@/lib/sitemap";

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, articles] = await Promise.all([
    getListingProducts(),
    newsArticleSource.getAllArticles(),
  ]);

  return buildSitemapEntries({
    productHandles: products.map((product) => product.handle),
    articles: articles.map((article) => ({
      handle: article.handle,
      publishedAt: article.publishedAt,
    })),
  });
}
