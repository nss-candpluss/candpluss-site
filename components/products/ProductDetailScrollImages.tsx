import { SiteImage } from "@/components/ui/SiteImage";

import type { ProductImage } from "@/types/product";

type ProductDetailScrollImagesProps = {
  images: ProductImage[];
  priority?: boolean;
};

export function ProductDetailScrollImages({
  images,
  priority = false,
}: ProductDetailScrollImagesProps) {
  return (
    <>
      {images.map((image, index) => (
        <div
          key={image.src}
          className="relative aspect-square w-full overflow-hidden bg-[var(--color-line)] min-[1025px]:aspect-auto min-[1025px]:h-[100svh]"
        >
          <SiteImage
            src={image.src}
            alt={image.alt}
            fill
            sizes="(min-width: 1025px) 60vw, 100vw"
            priority={priority && index === 0}
            className="object-cover object-center"
          />
        </div>
      ))}
    </>
  );
}
