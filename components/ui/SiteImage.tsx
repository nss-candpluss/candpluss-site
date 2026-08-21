import NextImage, { type ImageProps } from "next/image";

import { assetPath } from "@/lib/assetPath";
import {
  isShopifyCdnUrl,
  shopifyDeliveryWidth,
  withShopifyCdnWidth,
} from "@/lib/images/shopify-cdn";

const PRODUCT_IMAGE_QUALITY = 90;

function resolveImageSrc(src: ImageProps["src"]): ImageProps["src"] {
  if (typeof src === "string") {
    return assetPath(src);
  }

  return src;
}

export function SiteImage({ src, quality, unoptimized, ...props }: ImageProps) {
  const resolvedSrc = resolveImageSrc(src);

  if (typeof resolvedSrc === "string" && isShopifyCdnUrl(resolvedSrc)) {
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
