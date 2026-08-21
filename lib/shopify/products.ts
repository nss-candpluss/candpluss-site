import "server-only";

import { shopifyStorefrontRequest } from "@/lib/shopify/client";
import type {
  Product,
  ProductCategorySlug,
  ProductFeature,
  ProductGalleryMedia,
  ProductImage,
  ProductSizeSpec,
  ProductStatus,
  ProductVariant,
} from "@/types/product";
import { productCategories } from "@/types/product";

const PRODUCT_MEDIA_FRAGMENT = `
  ... on MediaImage {
    id
    image { url altText width height }
  }
  ... on Video {
    id
    alt
    previewImage { url altText width height }
    sources { url mimeType }
  }
`;

const FILE_REFERENCE_FRAGMENT = `
  ${PRODUCT_MEDIA_FRAGMENT}
  ... on GenericFile {
    id
    url
    mimeType
  }
`;

const METAOBJECT_FRAGMENT = `
  ... on Metaobject {
    id
    type
    fields {
      key
      type
      value
      reference {
        ${FILE_REFERENCE_FRAGMENT}
      }
      references(first: 100) {
        nodes {
          ${FILE_REFERENCE_FRAGMENT}
          ... on Metaobject {
            id
            type
            fields {
              key
              type
              value
              reference { ${FILE_REFERENCE_FRAGMENT} }
              references(first: 100) { nodes { ${FILE_REFERENCE_FRAGMENT} } }
            }
          }
          ... on Product { id handle }
        }
      }
    }
  }
`;

const PRODUCT_FRAGMENT = `
  id
  handle
  title
  description
  productType
  availableForSale
  featuredImage { url altText width height }
  media(first: 100) {
    nodes { ${PRODUCT_MEDIA_FRAGMENT} }
  }
  variants(first: 100) {
    nodes {
      id
      title
      sku
      availableForSale
      quantityAvailable
      selectedOptions { name value }
      price { amount currencyCode }
      compareAtPrice { amount currencyCode }
      image { url altText width height }
      colorCode: metafield(namespace: "custom", key: "color_code") { value }
      swatch: metafield(namespace: "custom", key: "swatch") { value }
      gallery: metafield(namespace: "custom", key: "gallery") {
        references(first: 100) { nodes { ${FILE_REFERENCE_FRAGMENT} } }
      }
    }
  }
  salesStatus: metafield(namespace: "custom", key: "sales_status") {
    reference { ${METAOBJECT_FRAGMENT} }
  }
  features: metafield(namespace: "custom", key: "features") {
    references(first: 100) { nodes { ${METAOBJECT_FRAGMENT} } }
  }
  sizeSpec: metafield(namespace: "custom", key: "size_spec") {
    reference { ${METAOBJECT_FRAGMENT} }
  }
  memberOnly: metafield(namespace: "custom", key: "member_only") { value }
  isNew: metafield(namespace: "custom", key: "is_new") { value }
  category: metafield(namespace: "custom", key: "category") {
    reference { ${METAOBJECT_FRAGMENT} }
  }
  downloads: metafield(namespace: "custom", key: "downloads") {
    references(first: 100) { nodes { ${FILE_REFERENCE_FRAGMENT} } }
  }
  optionProducts: metafield(namespace: "custom", key: "option_products") {
    references(first: 100) { nodes { ... on Product { id handle } } }
  }
`;

const PRODUCT_BY_HANDLE_QUERY = `
  query ProductByHandle($handle: String!) {
    product(handle: $handle) { ${PRODUCT_FRAGMENT} }
  }
`;

const PRODUCTS_QUERY = `
  query Products($first: Int!, $after: String) {
    products(first: $first, after: $after, sortKey: TITLE) {
      nodes { ${PRODUCT_FRAGMENT} }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

type ShopifyImage = {
  url: string;
  altText?: string | null;
  width?: number | null;
  height?: number | null;
};

type ShopifyMediaNode = {
  id: string;
  image?: ShopifyImage | null;
  previewImage?: ShopifyImage | null;
  sources?: Array<{ url: string; mimeType: string }>;
  url?: string;
  mimeType?: string;
  alt?: string | null;
};

type ShopifyMetaobjectField = {
  key: string;
  type: string;
  value?: string | null;
  reference?: ShopifyMediaNode | null;
  references?: { nodes: Array<ShopifyMediaNode | ShopifyMetaobject | ShopifyProductRef> };
};

type ShopifyMetaobject = {
  id: string;
  type: string;
  fields: ShopifyMetaobjectField[];
};

type ShopifyProductRef = {
  id: string;
  handle: string;
};

type ShopifyVariant = {
  id: string;
  title: string;
  sku?: string | null;
  availableForSale: boolean;
  quantityAvailable?: number | null;
  selectedOptions: Array<{ name: string; value: string }>;
  price: { amount: string; currencyCode: string };
  compareAtPrice?: { amount: string; currencyCode: string } | null;
  image?: ShopifyImage | null;
  colorCode?: { value?: string | null } | null;
  swatch?: { value?: string | null } | null;
  gallery?: { references?: { nodes: ShopifyMediaNode[] } | null } | null;
};

type ShopifyProduct = {
  id: string;
  handle: string;
  title: string;
  description: string;
  productType?: string;
  availableForSale: boolean;
  featuredImage?: ShopifyImage | null;
  media: { nodes: ShopifyMediaNode[] };
  variants: { nodes: ShopifyVariant[] };
  salesStatus?: { reference?: ShopifyMetaobject | null } | null;
  features?: { references?: { nodes: ShopifyMetaobject[] } | null } | null;
  sizeSpec?: { reference?: ShopifyMetaobject | null } | null;
  memberOnly?: { value?: string | null } | null;
  isNew?: { value?: string | null } | null;
  category?: { reference?: ShopifyMetaobject | null } | null;
  downloads?: { references?: { nodes: ShopifyMediaNode[] } | null } | null;
  optionProducts?: { references?: { nodes: ShopifyProductRef[] } | null } | null;
};

function fieldMap(metaobject?: ShopifyMetaobject | null) {
  return new Map(metaobject?.fields.map((field) => [field.key, field]) ?? []);
}

function parseJsonValue<T>(value: string | null | undefined, fallback: T): T {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function mapImage(image: ShopifyImage | null | undefined, fallbackAlt: string): ProductImage | null {
  if (!image?.url) {
    return null;
  }

  return {
    src: image.url,
    alt: image.altText || fallbackAlt,
    width: image.width ?? undefined,
    height: image.height ?? undefined,
  };
}

function mapMedia(
  node: ShopifyMediaNode | null | undefined,
  fallbackAlt: string
): ProductGalleryMedia | null {
  if (!node) {
    return null;
  }

  const image = mapImage(node.image, fallbackAlt);
  if (image) {
    return { id: node.id, kind: "image", ...image };
  }

  const videoSource =
    node.sources?.find((source) => source.mimeType === "video/mp4") ??
    node.sources?.[0];
  const genericVideo =
    node.mimeType?.startsWith("video/") && node.url ? node.url : undefined;
  const src = videoSource?.url ?? genericVideo;
  if (!src) {
    return null;
  }

  return {
    id: node.id,
    kind: "video",
    src,
    poster: node.previewImage?.url,
    alt: node.alt || fallbackAlt,
  };
}

function mapMediaNodes(nodes: ShopifyMediaNode[], fallbackAlt: string) {
  return nodes
    .map((node) => mapMedia(node, fallbackAlt))
    .filter((media): media is ProductGalleryMedia => Boolean(media));
}

function colorValue(variant: ShopifyVariant) {
  return (
    variant.selectedOptions.find((option) =>
      /^(color|colour|カラー)$/i.test(option.name)
    )?.value ?? variant.title
  );
}

function colorCode(variant: ShopifyVariant) {
  return (
    variant.colorCode?.value?.trim() ||
    colorValue(variant).toLowerCase().replace(/[^a-z0-9]+/g, "-")
  );
}

function mapVariant(
  variant: ShopifyVariant,
  product: ShopifyProduct,
  productMedia: ProductGalleryMedia[]
): ProductVariant {
  const variantImage = mapImage(variant.image, `${product.title} ${variant.title}`);
  const galleryMedia = mapMediaNodes(
    variant.gallery?.references?.nodes ?? [],
    `${product.title} ${variant.title}`
  );
  const fallbackImages = [
    ...(variantImage ? [variantImage] : []),
    ...productMedia
      .filter((media) => media.kind === "image")
      .map(({ src, alt, width, height }) => ({ src, alt, width, height })),
  ].filter(
    (image, index, images) =>
      images.findIndex((candidate) => candidate.src === image.src) === index
  );

  return {
    id: colorCode(variant),
    colorCode: colorCode(variant),
    colorName: colorValue(variant),
    swatch: variant.swatch?.value || "#191919",
    code: variant.sku || undefined,
    shopifyVariantId: variant.id,
    price: {
      amount: Number(variant.price.amount),
      currencyCode: variant.price.currencyCode,
    },
    compareAtPrice: variant.compareAtPrice
      ? {
          amount: Number(variant.compareAtPrice.amount),
          currencyCode: variant.compareAtPrice.currencyCode,
        }
      : null,
    availableForSale: variant.availableForSale,
    quantityAvailable: variant.quantityAvailable,
    galleryMedia: galleryMedia.length ? galleryMedia : productMedia,
    gallery: {
      type: "standard",
      images:
        fallbackImages.length > 0
          ? fallbackImages
          : [{ src: "/images/products/_shared/placeholder.webp", alt: product.title }],
    },
  };
}

const FEATURE_GROUPS = ["Fabric", "Flame", "Structure", "Parts"] as const;

function mapFeatureGroup(value?: string | null) {
  if (!value) {
    return undefined;
  }

  return FEATURE_GROUPS.find(
    (group) => group.toLowerCase() === value.trim().toLowerCase()
  );
}

export function mapStorefrontHref(url: string) {
  try {
    const parsed = new URL(url, "https://candpluss.camp");
    const productPath = parsed.pathname.match(/(\/products(?:\/[\w-]+)?)\/?$/);

    if (productPath) {
      return `${productPath[1]}${parsed.hash}`;
    }

    return `${parsed.pathname}${parsed.hash}` || url;
  } catch {
    return url;
  }
}

const FEATURE_LINK_MAX = 5;

function mapPairedFeatureLink(
  fields: Map<string, ShopifyMetaobjectField>,
  labelKey: string,
  urlKey: string
) {
  const label = fields.get(labelKey)?.value?.trim();
  const href = fields.get(urlKey)?.value?.trim();

  if (!label || !href) {
    return null;
  }

  return {
    label,
    href: mapStorefrontHref(href),
  };
}

function mapFeatureLinks(fields: Map<string, ShopifyMetaobjectField>) {
  const links = [
    mapPairedFeatureLink(fields, "link_label", "link_url"),
    ...Array.from({ length: FEATURE_LINK_MAX }, (_, index) =>
      mapPairedFeatureLink(
        fields,
        `link_label_${index + 1}`,
        `link_url_${index + 1}`
      )
    ),
  ].filter((link): link is NonNullable<typeof link> => Boolean(link));

  return links.length ? links : undefined;
}

function mapFeature(metaobject: ShopifyMetaobject, index: number): ProductFeature {
  const fields = fieldMap(metaobject);
  const media = mapMediaNodes(
    (fields.get("media")?.references?.nodes ?? []) as ShopifyMediaNode[],
    fields.get("title")?.value || `Feature ${index + 1}`
  );
  const images = media
    .filter((item) => item.kind === "image")
    .map((item) => item.src);
  const video = media.find((item) => item.kind === "video");

  return {
    id: metaobject.id,
    group: mapFeatureGroup(fields.get("group")?.value),
    title: fields.get("title")?.value || `Feature ${index + 1}`,
    body: fields.get("body")?.value || "",
    image: images[0],
    images: images.length ? images : undefined,
    video:
      video?.kind === "video"
        ? { src: video.src, poster: video.poster, alt: video.alt }
        : undefined,
    links: mapFeatureLinks(fields),
  };
}

function mapDownloads(nodes: ShopifyMediaNode[]) {
  return nodes.flatMap((node) =>
    node.url
      ? [
          {
            label:
              decodeURIComponent(node.url.split("/").pop()?.split("?")[0] || "") ||
              "Download",
            href: node.url,
          },
        ]
      : []
  );
}

function mapSizeSpec(
  metaobject?: ShopifyMetaobject | null,
  productDownloads: ShopifyMediaNode[] = []
): ProductSizeSpec | undefined {
  if (!metaobject && !productDownloads.length) {
    return undefined;
  }

  const fields = fieldMap(metaobject);
  const groups = (fields.get("groups")?.references?.nodes ?? []).filter(
    (node): node is ShopifyMetaobject => "fields" in node
  );
  const drawing = mapMedia(
    fields.get("drawing")?.reference as ShopifyMediaNode,
    "Size drawing"
  );
  const notes = parseJsonValue<string[]>(fields.get("notes")?.value, []);
  const downloads = mapDownloads([
    ...((fields.get("downloads")?.references?.nodes ?? []) as ShopifyMediaNode[]),
    ...productDownloads,
  ]);

  return {
    specGroups: groups.map((group) => {
      const groupFields = fieldMap(group);
      return {
        label: groupFields.get("label")?.value || "",
        value: groupFields.get("value")?.value || "",
      };
    }),
    notes,
    drawingImage:
      drawing?.kind === "image"
        ? { src: drawing.src, alt: drawing.alt }
        : undefined,
    downloads: downloads.length ? downloads : undefined,
  };
}

type SiteCategory = Exclude<(typeof productCategories)[number], { slug: "all" }>;

const SITE_CATEGORIES = productCategories.filter(
  (category): category is SiteCategory => category.slug !== "all"
);

function categorySlug(productType?: string): ProductCategorySlug {
  const normalized = productType?.toLowerCase() ?? "";
  if (/option|オプション/.test(normalized)) return "tent-option";
  if (/tent|shelter|テント|シェルター/.test(normalized)) return "tent-shelter";
  if (/tarp|タープ/.test(normalized)) return "tarp";
  if (/peg|hammer|ペグ|ハンマー/.test(normalized)) return "peg-hammer";
  return "accessory";
}

function mapCategory(product: ShopifyProduct): {
  category: string;
  categorySlug: ProductCategorySlug;
} {
  const fields = fieldMap(product.category?.reference);
  const slug = fields.get("slug")?.value?.trim();
  const label = fields.get("label")?.value?.trim();
  const matched = SITE_CATEGORIES.find(
    (category) => category.slug === slug || category.label === label
  );

  if (matched) {
    return {
      category: label || matched.label,
      categorySlug: matched.slug,
    };
  }

  return {
    category: product.productType || "アクセサリー",
    categorySlug: categorySlug(product.productType),
  };
}

function mapStatus(product: ShopifyProduct): {
  status: ProductStatus;
  statusLabel?: string;
  statusColor?: string;
} {
  const fields = fieldMap(product.salesStatus?.reference);
  const configuredValue = fields.get("status")?.value;
  const configuredStatuses: ProductStatus[] = [
    "available",
    "new",
    "comingSoon",
    "waiting",
    "preorder",
    "ending",
    "ended",
    "soldOut",
    "preorderMember",
    "backorderMember",
    "discontinuedSoon",
    "discontinued",
  ];
  const configured = configuredStatuses.find(
    (status) => status === configuredValue
  );

  if (configured) {
    return {
      status: configured,
      statusLabel: fields.get("label")?.value || undefined,
      statusColor: fields.get("color")?.value || undefined,
    };
  }

  return product.availableForSale
    ? { status: "available" }
    : { status: "soldOut", statusLabel: "SOLD OUT" };
}

export function mapShopifyProductToProduct(product: ShopifyProduct): Product {
  const productMedia = mapMediaNodes(product.media.nodes, product.title);
  const variants = product.variants.nodes.map((variant) =>
    mapVariant(variant, product, productMedia)
  );
  const firstVariant = variants[0];
  const mappedCategory = mapCategory(product);
  const mappedStatus = mapStatus(product);
  const memberAccessConfigured = Boolean(product.memberOnly?.value);
  const memberAccess =
    product.memberOnly?.value === "true" ? "memberOnly" : "public";
  const badges: "new"[] = product.isNew?.value === "true" ? ["new"] : [];
  const isOnSale = variants.some(
    (variant) =>
      variant.compareAtPrice &&
      variant.price &&
      variant.compareAtPrice.amount > variant.price.amount
  );
  const defaultStatusLabels: Partial<Record<ProductStatus, string>> = {
    new: "NEW",
    comingSoon: "近日発売",
    waiting: "入荷待ち",
    preorder: "予約販売",
    ending: "在庫限り販売終了",
    ended: "販売終了",
    soldOut: "SOLD OUT",
    preorderMember: "先行予約：会員限定",
    backorderMember: "予約注文：会員限定",
    discontinuedSoon: "廃盤：在庫限り",
    discontinued: "販売終了",
  };
  const statusLabels = [
    ...(badges.includes("new") ? ["NEW"] : []),
    ...(isOnSale ? ["SALE"] : []),
    ...(memberAccess === "memberOnly" ? ["会員限定"] : []),
    mappedStatus.statusLabel ?? defaultStatusLabels[mappedStatus.status],
  ].filter((label): label is string => Boolean(label));

  return {
    id: product.id,
    handle: product.handle,
    title: product.title,
    code: firstVariant?.code,
    category: mappedCategory.category,
    categorySlug: mappedCategory.categorySlug,
    price: firstVariant?.price?.amount ?? 0,
    priceLabel: firstVariant?.price
      ? `¥${firstVariant.price.amount.toLocaleString("ja-JP")}`
      : "TBD",
    currencyCode: firstVariant?.price?.currencyCode,
    ...mappedStatus,
    statusLabel: statusLabels.length ? statusLabels.join("　") : undefined,
    memberAccess,
    memberAccessConfigured,
    badges,
    isOnSale: Boolean(isOnSale),
    description: product.description,
    variants,
    features:
      product.features?.references?.nodes.map(mapFeature) ?? undefined,
    sizeSpec: mapSizeSpec(
      product.sizeSpec?.reference,
      product.downloads?.references?.nodes ?? []
    ),
    options:
      product.optionProducts?.references?.nodes.map((option) => option.handle) ??
      undefined,
  };
}

export async function fetchProductByHandle(handle: string): Promise<Product | null> {
  const data = await shopifyStorefrontRequest<{ product: ShopifyProduct | null }>(
    PRODUCT_BY_HANDLE_QUERY,
    {
      variables: { handle },
      tags: ["shopify-products", `shopify-product:${handle}`],
      revalidate: 300,
    }
  );

  return data.product ? mapShopifyProductToProduct(data.product) : null;
}

export async function fetchAllProducts(): Promise<Product[]> {
  const products: Product[] = [];
  let after: string | null = null;

  do {
    const data: {
      products: {
        nodes: ShopifyProduct[];
        pageInfo: { hasNextPage: boolean; endCursor: string | null };
      };
    } = await shopifyStorefrontRequest(PRODUCTS_QUERY, {
      variables: { first: 100, after },
      tags: ["shopify-products"],
      revalidate: 300,
    });

    products.push(...data.products.nodes.map(mapShopifyProductToProduct));
    after = data.products.pageInfo.hasNextPage
      ? data.products.pageInfo.endCursor
      : null;
  } while (after);

  return products;
}
