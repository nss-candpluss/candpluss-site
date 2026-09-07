import NextImage, { type ImageProps } from "next/image";

import { assetPath } from "@/lib/assetPath";
import {
  isShopifyCdnUrl,
  shopifyDeliveryWidth,
  withShopifyCdnWidth,
} from "@/lib/images/shopify-cdn";

const PRODUCT_IMAGE_QUALITY = 90;

type SiteImageProps = ImageProps & {
  /** Shopify CDN のリサイズを使わず、登録済みの元画像を配信する */
  shopifyOriginal?: boolean;
};

function resolveImageSrc(src: ImageProps["src"]): ImageProps["src"] {
  if (typeof src === "string") {
    return assetPath(src);
  }

  return src;
}

export function SiteImage({
  src,
  quality,
  unoptimized,
  shopifyOriginal = false,
  ...props
}: SiteImageProps) {
  const resolvedSrc = resolveImageSrc(src);

  if (typeof resolvedSrc === "string" && isShopifyCdnUrl(resolvedSrc)) {
    if (shopifyOriginal) {
      return <NextImage src={resolvedSrc} unoptimized {...props} />;
    }

    const deliveryWidth = shopifyDeliveryWidth({
      width: props.width,
      sizes: props.sizes,
    });

    return (
      <NextImage
        src={withShopifyCdnWidth(resolvedSrc, deliveryWidth)}
        quality={quality ?? PRODUCT_IMAGE_QUALITY}
        unoptimized
        {...props}
      />
    );
  }

  return (
    <NextImage
      src={resolvedSrc}
      quality={quality ?? PRODUCT_IMAGE_QUALITY}
      unoptimized={unoptimized}
      {...props}
    />
  );
}
