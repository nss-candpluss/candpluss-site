import { SiteImage } from "@/components/ui/SiteImage";
import type { ImageProps } from "next/image";

type MaskedImageProps = {
  src: string;
  alt: string;
  sizes: string;
  aspectClassName: string;
  containerClassName?: string;
  imageClassName?: string;
  priority?: boolean;
  onLoad?: ImageProps["onLoad"];
};

export function MaskedImage({
  src,
  alt,
  sizes,
  aspectClassName,
  containerClassName = "",
  imageClassName = "",
  priority,
  onLoad,
}: MaskedImageProps) {
  return (
    <div
      className={`image-mask-frame relative ${aspectClassName} ${containerClassName}`.trim()}
    >
      <SiteImage
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        onLoad={onLoad}
        className={`object-cover ${imageClassName}`.trim()}
      />
    </div>
  );
}
