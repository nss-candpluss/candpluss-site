import type { Product, ProductImage, ProductVariant } from "@/types/product";

export type Moya500DesignGalleryImage = {
  id: string;
  kind: "image";
  src: string;
  thumbnailSrc: string;
  alt: string;
};

export type Moya500DesignGalleryVideo = {
  id: string;
  kind: "video";
  src: string;
  poster: string;
  thumbnailPoster: string;
  alt: string;
};

export type Moya500DesignGalleryItem =
  | Moya500DesignGalleryImage
  | Moya500DesignGalleryVideo;

export function galleryItemKey(item: Moya500DesignGalleryItem) {
  return item.id;
}

const DUMMY_GALLERY_ITEM_COUNT = 20;
const CLASSIC_YELLOW_GALLERY_ROOT = "/images/products/moya500";
const THUMBNAIL_ROOT = "/images/products/moya500/thumbnails";

export function moya500DesignThumbnailSrc(src: string) {
  const filename = src.split("/").pop()?.replace(/\.[^.]+$/, ".webp");

  return filename ? `${THUMBNAIL_ROOT}/${filename}` : src;
}

function buildMoya500Gallery(colorCode: string): Moya500DesignGalleryItem[] {
  if (colorCode === "cy") {
    return Array.from(
      { length: DUMMY_GALLERY_ITEM_COUNT },
      (_, index): Moya500DesignGalleryItem => {
        const imageNumber = String(index + 1).padStart(2, "0");

        if (index === 10) {
          return {
            id: "cy-gallery-movie-01",
            kind: "video",
            src: "/videos/products/moya500/moya500-gallery-movie-01.mp4",
            poster:
              "/images/products/moya500/moya500-gallery-movie-01-poster.webp",
            thumbnailPoster:
              `${THUMBNAIL_ROOT}/moya500-gallery-movie-01-poster.webp`,
            alt: "MOYA500 Classic Yellow gallery movie 1",
          };
        }

        const src = `${CLASSIC_YELLOW_GALLERY_ROOT}/moya500-cy-gallery-${imageNumber}.webp`;

        return {
          id: `cy-gallery-${imageNumber}`,
          kind: "image",
          src,
          thumbnailSrc: `${THUMBNAIL_ROOT}/moya500-cy-gallery-${imageNumber}.webp`,
          alt: `MOYA500 Classic Yellow gallery ${index + 1}`,
        };
      }
    );
  }

  const colorImageNames = [
    "open-01-front",
    "open-02-front-right",
    "open-03-right",
    "open-05-front-left",
    "close-01-front",
    "close-02-front-right",
    "close-03-right",
    "close-05-front-left",
  ];

  const colorImages: Moya500DesignGalleryImage[] = colorImageNames.map(
    (name, index) => ({
      id: `color-${index + 1}`,
      kind: "image",
      src: `/images/products/moya500/${colorCode}-${name}.webp`,
      thumbnailSrc: `${THUMBNAIL_ROOT}/${colorCode}-${name}.webp`,
      alt: `MOYA500 ${colorCode.toUpperCase()} design dummy ${index + 1}`,
    })
  );

  const photoImages: Moya500DesignGalleryImage[] = Array.from(
    { length: 4 },
    (_, index) => ({
      id: `photo-${index + 1}`,
      kind: "image",
      src: `/images/products/moya500/photo-image-0${index + 1}.webp`,
      thumbnailSrc: `${THUMBNAIL_ROOT}/photo-image-0${index + 1}.webp`,
      alt: `MOYA500 design dummy photo ${index + 1}`,
    })
  );

  const baseItems: Moya500DesignGalleryImage[] = [
    ...colorImages,
    ...photoImages,
  ];
  const repeatedImages = Array.from(
    { length: DUMMY_GALLERY_ITEM_COUNT - baseItems.length },
    (_, index): Moya500DesignGalleryImage => {
      const source = baseItems[index % baseItems.length];

      return {
        ...source,
        id: `repeat-${index + 1}`,
        alt: `${source.alt} repeat ${index + 1}`,
      };
    }
  );

  return [...baseItems, ...repeatedImages];
}

function productImageToGalleryItem(
  image: ProductImage,
  index: number
): Moya500DesignGalleryImage {
  return {
    id: `product-gallery-${index}-${image.src}`,
    kind: "image",
    src: image.src,
    thumbnailSrc: image.src,
    alt: image.alt,
  };
}

/**
 * デザイン確認ページのギャラリー表現を、通常の商品データへ適用する。
 * MOYA500 は確認済みの20点構成を維持し、それ以外は各バリアントの
 * standard / openClose ギャラリーを表示順のまま1本化する。
 */
export function buildProductDetailGallery(
  product: Product,
  variant: ProductVariant | null
): Moya500DesignGalleryItem[] {
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

  if (product.handle === "moya500" || product.handle === "moya500-design") {
    return buildMoya500Gallery(variant?.colorCode ?? "cy");
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
