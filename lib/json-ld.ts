import { footerContent } from "@/data/footer";
import { getProductListingImage, getVariantChipImage } from "@/lib/products/gallery";
import { getProductMetaDescription } from "@/lib/products/description";
import {
  getProductDetailHref,
  getProductVariantOptionName,
  isPlaceholderProductVariantName,
} from "@/lib/products/helpers";
import { resolveArticleExcerpt } from "@/lib/news/excerpt";
import { isSocialLinkVisible } from "@/lib/site-navigation-visibility";
import { absoluteUrl } from "@/lib/site-metadata";
import { siteConfig } from "@/lib/site";
import type { NewsArticle } from "@/lib/news/types";
import type { Product, ProductStatus, ProductVariant } from "@/types/product";

type JsonLdObject = Record<string, unknown>;

export type BreadcrumbItem = {
  name: string;
  path: string;
};

const SCHEMA = "https://schema.org";

const OUT_OF_STOCK_STATUSES: readonly ProductStatus[] = [
  "soldOut",
  "ended",
  "discontinued",
];
const PREORDER_STATUSES: readonly ProductStatus[] = [
  "preorder",
  "preorderMember",
  "comingSoon",
  "waiting",
];
const BACKORDER_STATUSES: readonly ProductStatus[] = ["backorderMember"];

function isProfileUrl(href: string): boolean {
  try {
    const url = new URL(href);
    return url.pathname !== "/" && url.pathname !== "";
  } catch {
    return false;
  }
}

export function organizationSameAs(): string[] {
  return footerContent.socialLinks
    .filter((link) => isSocialLinkVisible(link.label) && isProfileUrl(link.href))
    .map((link) => link.href);
}

function organizationAddress(): JsonLdObject {
  return {
    "@type": "PostalAddress",
    postalCode: siteConfig.address.postalCode,
    addressRegion: siteConfig.address.addressRegion,
    addressLocality: siteConfig.address.addressLocality,
    streetAddress: siteConfig.address.streetAddress,
    addressCountry: siteConfig.address.addressCountry,
  };
}

function organizationCore(): JsonLdObject {
  return {
    name: siteConfig.name,
    legalName: siteConfig.legalName,
    url: siteConfig.url,
    description: siteConfig.description,
    email: siteConfig.email,
    telephone: siteConfig.telephone,
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl(siteConfig.logo),
    },
    address: organizationAddress(),
    sameAs: organizationSameAs(),
  };
}

export function buildOrganizationJsonLd(): JsonLdObject {
  return {
    "@context": SCHEMA,
    "@type": "Organization",
    ...organizationCore(),
  };
}

export function buildOnlineStoreJsonLd(): JsonLdObject {
  return {
    "@context": SCHEMA,
    "@type": "OnlineStore",
    ...organizationCore(),
    currenciesAccepted: "JPY",
    paymentAccepted:
      "クレジットカード, Google Pay, Apple Pay, Amazon Pay, 銀行振込",
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: siteConfig.email,
      telephone: siteConfig.telephone,
    },
    parentOrganization: {
      "@type": "Organization",
      name: siteConfig.legalName,
      legalName: siteConfig.legalName,
      address: organizationAddress(),
      email: siteConfig.email,
      telephone: siteConfig.telephone,
    },
    hasMerchantReturnPolicy: {
      "@type": "MerchantReturnPolicy",
      applicableCountry: "JP",
      returnPolicyCountry: "JP",
      returnPolicyCategory: `${SCHEMA}/MerchantReturnFiniteReturnWindow`,
      merchantReturnDays: 7,
      returnMethod: `${SCHEMA}/ReturnByMail`,
      returnFees: `${SCHEMA}/ReturnShippingFees`,
      merchantReturnLink: absoluteUrl("/shopping-guide"),
    },
  };
}

export function pageBreadcrumb(items: BreadcrumbItem[]): BreadcrumbItem[] {
  return [{ name: siteConfig.name, path: "/" }, ...items];
}

export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]): JsonLdObject {
  return {
    "@context": SCHEMA,
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function productAvailability(product: Product): string {
  if (OUT_OF_STOCK_STATUSES.includes(product.status)) {
    return `${SCHEMA}/OutOfStock`;
  }

  if (PREORDER_STATUSES.includes(product.status)) {
    return `${SCHEMA}/PreOrder`;
  }

  if (BACKORDER_STATUSES.includes(product.status)) {
    return `${SCHEMA}/BackOrder`;
  }

  const allUnavailable =
    product.variants.length > 0 &&
    product.variants.every((variant) => variant.availableForSale === false);

  if (allUnavailable) {
    return `${SCHEMA}/OutOfStock`;
  }

  return `${SCHEMA}/InStock`;
}

function productCurrency(product: Product, variant?: ProductVariant): string {
  return (
    variant?.price?.currencyCode ??
    product.variants[0]?.price?.currencyCode ??
    product.currencyCode ??
    "JPY"
  );
}

function variantAvailability(
  product: Product,
  variant?: ProductVariant
): string {
  if (variant?.availableForSale === false) {
    return `${SCHEMA}/OutOfStock`;
  }

  return productAvailability(product);
}

function offerBase(
  url: string,
  availability: string
): JsonLdObject {
  return {
    "@type": "Offer",
    url,
    availability,
    itemCondition: `${SCHEMA}/NewCondition`,
  };
}

function buildVariantOffer(
  product: Product,
  variant: ProductVariant
): JsonLdObject {
  const url = absoluteUrl(getProductDetailHref(product.handle, variant.id));
  const offer = offerBase(url, variantAvailability(product, variant));
  const price = variant.price?.amount ?? product.price;

  if (price <= 0) {
    return offer;
  }

  return {
    ...offer,
    priceCurrency: productCurrency(product, variant),
    price,
  };
}

function buildProductOffer(product: Product): JsonLdObject {
  const url = absoluteUrl(`/products/${product.handle}`);
  const availability = productAvailability(product);
  const prices = [
    product.price,
    ...product.variants.map((variant) => variant.price?.amount ?? product.price),
  ].filter((amount) => amount > 0);
  const offer = offerBase(url, availability);

  if (prices.length === 0) {
    return offer;
  }

  const lowPrice = Math.min(...prices);
  const highPrice = Math.max(...prices);

  if (lowPrice !== highPrice) {
    return {
      "@type": "AggregateOffer",
      url,
      priceCurrency: productCurrency(product),
      lowPrice,
      highPrice,
      offerCount: prices.length,
      availability,
      itemCondition: `${SCHEMA}/NewCondition`,
    };
  }

  return {
    ...offer,
    priceCurrency: productCurrency(product),
    price: lowPrice,
  };
}

function productBrand(): JsonLdObject {
  return {
    "@type": "Brand",
    name: siteConfig.name,
  };
}

function productImageUrl(product: Product, variant?: ProductVariant): string {
  const image =
    (variant ? getVariantChipImage(variant)?.src : undefined) ??
    getProductListingImage(product)?.src ??
    siteConfig.ogImage;

  return absoluteUrl(image);
}

function productVariesBy(product: Product): string {
  const optionName = getProductVariantOptionName(product);

  if (optionName.includes("SIZE") || optionName.includes("サイズ")) {
    return `${SCHEMA}/size`;
  }

  return `${SCHEMA}/color`;
}

function variantDimensionKey(product: Product): "color" | "size" {
  return productVariesBy(product) === `${SCHEMA}/size` ? "size" : "color";
}

export function hasProductGroupVariants(product: Product): boolean {
  return (
    product.variants.filter(
      (variant) => !isPlaceholderProductVariantName(variant.colorName)
    ).length > 1
  );
}

function buildProductVariantJsonLd(
  product: Product,
  variant: ProductVariant
): JsonLdObject {
  const dimensionKey = variantDimensionKey(product);
  const sku = variant.code ?? product.code;
  const variantLabel = isPlaceholderProductVariantName(variant.colorName)
    ? product.title
    : `${product.title} ${variant.colorName}`;

  return {
    "@type": "Product",
    name: variantLabel,
    ...(sku ? { sku } : {}),
    image: productImageUrl(product, variant),
    [dimensionKey]: variant.colorName,
    offers: buildVariantOffer(product, variant),
  };
}

export function buildProductJsonLd(product: Product): JsonLdObject {
  const sku = product.code ?? product.variants[0]?.code;
  const description = getProductMetaDescription(product.description);

  return {
    "@context": SCHEMA,
    "@type": "Product",
    name: product.title,
    description,
    url: absoluteUrl(`/products/${product.handle}`),
    image: productImageUrl(product),
    brand: productBrand(),
    ...(sku ? { sku } : {}),
    category: product.category,
    offers: buildProductOffer(product),
  };
}

export function buildProductGroupJsonLd(product: Product): JsonLdObject {
  const description = getProductMetaDescription(product.description);

  return {
    "@context": SCHEMA,
    "@type": "ProductGroup",
    name: product.title,
    description,
    url: absoluteUrl(`/products/${product.handle}`),
    image: productImageUrl(product),
    brand: productBrand(),
    category: product.category,
    productGroupID: product.handle,
    variesBy: [productVariesBy(product)],
    hasVariant: product.variants.map((variant) =>
      buildProductVariantJsonLd(product, variant)
    ),
  };
}

export function buildProductPageJsonLd(product: Product): JsonLdObject {
  return hasProductGroupVariants(product)
    ? buildProductGroupJsonLd(product)
    : buildProductJsonLd(product);
}

export function buildNewsArticleJsonLd(article: NewsArticle): JsonLdObject {
  const url = absoluteUrl(`/news/${article.handle}`);

  return {
    "@context": SCHEMA,
    "@type": "NewsArticle",
    headline: article.title,
    description: resolveArticleExcerpt(article),
    image: absoluteUrl(article.image),
    datePublished: article.publishedAt,
    dateModified: article.publishedAt,
    mainEntityOfPage: url,
    author: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl(siteConfig.logo),
      },
    },
  };
}
