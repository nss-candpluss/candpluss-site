import { describe, expect, it } from "vitest";

import {
  buildBreadcrumbJsonLd,
  buildNewsArticleJsonLd,
  buildOnlineStoreJsonLd,
  buildOrganizationJsonLd,
  buildProductJsonLd,
  buildProductPageJsonLd,
  hasProductGroupVariants,
  organizationSameAs,
  pageBreadcrumb,
  productAvailability,
} from "@/lib/json-ld";
import { newsItems } from "@/data/news";
import { absoluteUrl } from "@/lib/site-metadata";
import { siteConfig } from "@/lib/site";
import type { Product } from "@/types/product";

const product: Product = {
  id: "moya500",
  handle: "moya500",
  title: "MOYA500",
  code: "MOYA500",
  category: "テント・シェルター",
  categorySlug: "tent-shelter",
  price: 372000,
  priceLabel: "¥372,000",
  currencyCode: "JPY",
  status: "available",
  description: "{見出し}\n本文です",
  variants: [
    {
      id: "cy",
      colorCode: "cy",
      colorName: "Classic Yellow",
      swatch: "#000",
      code: "MOYA500-CY",
      price: { amount: 372000, currencyCode: "JPY" },
      availableForSale: true,
      gallery: {
        type: "standard",
        images: [{ src: "/images/products/moya500/photo-image-01.webp", alt: "MOYA500" }],
      },
    },
  ],
};

describe("json-ld", () => {
  it("builds an Organization with the legal entity and real profile URLs", () => {
    const jsonLd = buildOrganizationJsonLd();
    const sameAs = organizationSameAs();

    expect(jsonLd["@type"]).toBe("Organization");
    expect(jsonLd.name).toBe(siteConfig.name);
    expect(jsonLd.legalName).toBe("株式会社NSS");
    expect(jsonLd.url).toBe("https://candpluss.camp");
    expect(sameAs.some((href) => href.includes("instagram.com"))).toBe(true);
    expect(sameAs.some((href) => href.includes("lin.ee"))).toBe(true);
    expect(sameAs).toContain("https://www.youtube.com/@CANDPLUSS");
    expect(sameAs).not.toContain("https://www.facebook.com/");
  });

  it("builds Product and Offer data from a priced in-stock item", () => {
    const jsonLd = buildProductJsonLd(product);
    const offers = jsonLd.offers as Record<string, unknown>;

    expect(jsonLd["@type"]).toBe("Product");
    expect(jsonLd.name).toBe("MOYA500");
    expect(jsonLd.description).toBe("本文です");
    expect(jsonLd.sku).toBe("MOYA500");
    expect(offers["@type"]).toBe("Offer");
    expect(offers.price).toBe(372000);
    expect(offers.priceCurrency).toBe("JPY");
    expect(offers.availability).toBe("https://schema.org/InStock");
    expect(productAvailability(product)).toBe("https://schema.org/InStock");
    expect(hasProductGroupVariants(product)).toBe(false);
    expect(buildProductPageJsonLd(product)["@type"]).toBe("Product");
  });

  it("builds an OnlineStore with the legal parent and return window", () => {
    const jsonLd = buildOnlineStoreJsonLd();
    const parent = jsonLd.parentOrganization as Record<string, unknown>;
    const returns = jsonLd.hasMerchantReturnPolicy as Record<string, unknown>;

    expect(jsonLd["@type"]).toBe("OnlineStore");
    expect(jsonLd.name).toBe(siteConfig.name);
    expect(jsonLd.legalName).toBe("株式会社NSS");
    expect(jsonLd.currenciesAccepted).toBe("JPY");
    expect(jsonLd.paymentAccepted).toBe(
      "クレジットカード, Google Pay, Apple Pay, 銀行振込"
    );
    expect(parent.name).toBe("株式会社NSS");
    expect(returns.merchantReturnDays).toBe(7);
    expect(returns.merchantReturnLink).toBe(
      "https://candpluss.camp/shopping-guide"
    );
  });

  it("builds a ProductGroup when a product has multiple color variants", () => {
    const grouped: Product = {
      ...product,
      variants: [
        product.variants[0]!,
        {
          ...product.variants[0]!,
          id: "gb",
          colorCode: "gb",
          colorName: "Gray Beige",
          code: "MOYA500-GB",
          price: { amount: 372000, currencyCode: "JPY" },
        },
      ],
    };
    const jsonLd = buildProductPageJsonLd(grouped);
    const variants = jsonLd.hasVariant as Array<Record<string, unknown>>;
    const firstOffer = variants[0]?.offers as Record<string, unknown>;

    expect(hasProductGroupVariants(grouped)).toBe(true);
    expect(jsonLd["@type"]).toBe("ProductGroup");
    expect(jsonLd.productGroupID).toBe("moya500");
    expect(jsonLd.variesBy).toEqual(["https://schema.org/color"]);
    expect(variants).toHaveLength(2);
    expect(variants[0]?.color).toBe("Classic Yellow");
    expect(variants[1]?.name).toBe("MOYA500 Gray Beige");
    expect(firstOffer.url).toBe(
      "https://candpluss.camp/products/moya500?color=cy"
    );
  });

  it("builds NewsArticle and BreadcrumbList with absolute URLs", () => {
    const article = newsItems[0];
    const articleJsonLd = buildNewsArticleJsonLd(article);
    const breadcrumb = buildBreadcrumbJsonLd(
      pageBreadcrumb([
        { name: "News & Topics", path: "/news" },
        { name: article.title, path: `/news/${article.handle}` },
      ])
    );
    const items = breadcrumb.itemListElement as Array<Record<string, unknown>>;

    expect(articleJsonLd["@type"]).toBe("NewsArticle");
    expect(articleJsonLd.headline).toBe(article.title);
    expect(articleJsonLd.datePublished).toBe(article.publishedAt);
    expect(articleJsonLd.image).toBe(absoluteUrl(article.image));
    expect(breadcrumb["@type"]).toBe("BreadcrumbList");
    expect(items).toHaveLength(3);
    expect(items[0]?.item).toBe("https://candpluss.camp/");
    expect(items[2]?.item).toBe(
      `https://candpluss.camp/news/${article.handle}`
    );
  });
});
