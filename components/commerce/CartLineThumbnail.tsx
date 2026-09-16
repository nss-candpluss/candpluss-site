import { SiteImage } from "@/components/ui/SiteImage";

type CartLineThumbnailProps = {
  src?: string | null;
  alt: string;
  sizes: string;
};

/** 大きさは `useCartThumbnailSize` がリスト単位で決め、CSS 変数で渡ってくる */
export function CartLineThumbnail({ src, alt, sizes }: CartLineThumbnailProps) {
  return (
    <div className="relative size-[var(--cart-thumbnail-size)] shrink-0 self-start bg-[#eef1f3]">
      {src ? (
        <SiteImage
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          className="object-cover"
        />
      ) : null}
    </div>
  );
}
