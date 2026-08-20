export type ProductStatus =
  | "available"
  | "new"
  | "comingSoon"
  | "waiting"
  | "preorder"
  | "ending"
  | "ended"
  | "soldOut"
  | "preorderMember"
  | "backorderMember"
  | "discontinuedSoon"
  | "discontinued";

export type ProductMemberAccess = "public" | "memberOnly";
export type ProductBadge = "new";

export type ProductImage = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
};

export type ProductVideo = {
  src: string;
  poster?: string;
  alt?: string;
};

export type ProductGalleryMedia =
  | ({
      id: string;
      kind: "image";
    } & ProductImage)
  | ({
      id: string;
      kind: "video";
    } & ProductVideo);

export type ProductMoney = {
  amount: number;
  currencyCode: string;
};

export type StandardGallery = {
  type: "standard";
  images: ProductImage[];
};

export type OpenCloseGroupId = "open" | "close";

export type OpenCloseGalleryGroup = {
  id: OpenCloseGroupId;
  label: "OPEN" | "CLOSE";
  images: ProductImage[];
};

export type OpenCloseGallery = {
  type: "openClose";
  groups: OpenCloseGalleryGroup[];
};

export type VariantGallery = StandardGallery | OpenCloseGallery;

export type ProductVariant = {
  id: string;
  colorCode: string;
  colorName: string;
  swatch: string;
  /** カラー別型番（Shopify SKU 連携想定） */
  code?: string;
  shopifyVariantId?: string | null;
  price?: ProductMoney;
  compareAtPrice?: ProductMoney | null;
  availableForSale?: boolean;
  quantityAvailable?: number | null;
  /** Shopifyで管理する、順序付きの画像・動画ギャラリー */
  galleryMedia?: ProductGalleryMedia[];
  gallery: VariantGallery;
};

export type ProductFeature = {
  id: string;
  group?: "Fabric" | "Flame" | "Structure" | "Parts";
  title: string;
  body: string;
  image?: string;
  images?: string[];
  video?: ProductVideo;
  links?: Array<{
    label: string;
    href: string;
  }>;
};

export type ProductSizeSpecItem = {
  label: string;
  value: string;
};

export type ProductSizeSpecGroup = {
  label: string;
  value: string;
};

export type ProductDownload = {
  label: string;
  href: string;
};

export type ProductSizeSpec = {
  /** ラベル / 値の2列レイアウト（旧形式） */
  specs?: ProductSizeSpecItem[];
  /** 見出し + 本文のグループ形式 */
  specGroups?: ProductSizeSpecGroup[];
  notes?: string[];
  drawingImage?: ProductImage;
  downloads?: ProductDownload[];
};

export type Product = {
  id: string;
  handle: string;
  title: string;
  code?: string;
  category: string;
  categorySlug: string;
  price: number;
  priceLabel: string;
  currencyCode?: string;
  status: ProductStatus;
  /** 商品固有のステータス表示（未指定時は status から自動生成） */
  statusLabel?: string;
  statusColor?: string;
  memberAccess?: ProductMemberAccess;
  memberAccessConfigured?: boolean;
  badges?: ProductBadge[];
  isOnSale?: boolean;
  description: string;
  /** ギャラリー下に縦スクロール表示する静止画像（最大5枚想定） */
  scrollImages?: ProductImage[];
  variants: ProductVariant[];
  features?: ProductFeature[];
  /** Feature 画像を {colorCode}-feature-XX.webp でカラー別表示する */
  colorKeyedFeatureImages?: boolean;
  sizeSpec?: ProductSizeSpec;
  options?: string[];
  /** true の場合、商品一覧ページに表示しない */
  listingHidden?: boolean;
};

export const productDetailTabs = [
  { id: "photo", label: "PHOTO" },
  { id: "feature", label: "FEATURE" },
  { id: "size-spec", label: "SIZE & SPEC" },
  { id: "options", label: "OPTIONS" },
] as const;

export const productCategories = [
  { label: "全ての商品", slug: "all" },
  { label: "テント・シェルター", slug: "tent-shelter" },
  { label: "テント・シェルター オプション", slug: "tent-option" },
  { label: "タープ", slug: "tarp" },
  { label: "ペグ・ペグハンマー", slug: "peg-hammer" },
  { label: "アクセサリー", slug: "accessory" },
] as const;

export type ProductCategorySlug = (typeof productCategories)[number]["slug"];
