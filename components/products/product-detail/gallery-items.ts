import type { Product, ProductImage, ProductVariant } from "@/types/product";

export type ProductDetailGalleryImage = {
  id: string;
  kind: "image";
  src: string;
  thumbnailSrc: string;
  alt: string;
};

export type ProductDetailGalleryVideo = {
  id: string;
  kind: "video";
  src: string;
  poster: string;
  thumbnailPoster: string;
  alt: string;
};

export type ProductDetailGalleryItem =
  | ProductDetailGalleryImage
  | ProductDetailGalleryVideo;

export function galleryItemKey(item: ProductDetailGalleryItem) {
  return item.id;
}

function productImageToGalleryItem(
  image: ProductImage,
  index: number
): ProductDetailGalleryImage {
  return {
    id: `product-gallery-${index}-${image.src}`,
    kind: "image",
    src: image.src,
    thumbnailSrc: image.src,
    alt: image.alt,
  };
}

/**
 * 全商品共通で、各バリアントのギャラリーデータを表示用に変換する。
 * galleryMedia を優先し、なければ standard / openClose ギャラリーを
 * 表示順のまま1本化する。
 */
export function buildProductDetailGallery(
  product: Product,
  variant: ProductVariant | null
): ProductDetailGalleryItem[] {
  if (variant?.galleryMedia?.length) {
    return variant.galleryMedia.map((item) =>
      item.kind === "video"
        ? {
            id: item.id,
            kind: "video",
            src: item.src,
            poster: item.poster ?? "",
            thumbnailPoster: item.poster ?? "",
            alt: item.alt ?? product.title,
          }
        : {
            id: item.id,
            kind: "image",
            src: item.src,
            thumbnailSrc: item.src,
            alt: item.alt,
          }
    );
  }

  if (!variant) {
    return [];
  }

  const images =
    variant.gallery.type === "standard"
      ? variant.gallery.images
      : variant.gallery.groups.flatMap((group) => group.images);

  return images.map(productImageToGalleryItem);
}
