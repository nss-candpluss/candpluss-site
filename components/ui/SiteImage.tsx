import NextImage, { type ImageProps } from "next/image";

import { assetPath } from "@/lib/assetPath";

function resolveImageSrc(src: ImageProps["src"]): ImageProps["src"] {
  if (typeof src === "string") {
    return assetPath(src);
  }

  return src;
}

export function SiteImage({ src, ...props }: ImageProps) {
  return <NextImage src={resolveImageSrc(src)} {...props} />;
}
