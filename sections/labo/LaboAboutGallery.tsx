import { SiteImage } from "@/components/ui/SiteImage";

type LaboAboutGalleryProps = {
  src: string;
  alt: string;
  className?: string;
};

export function LaboAboutGallery({ src, alt, className = "" }: LaboAboutGalleryProps) {
  return (
    <figure
      data-labo-about-gallery
      className={`relative overflow-hidden ${className}`.trim()}
    >
      <SiteImage
        src={src}
        alt={alt}
        fill
        sizes="(min-width: 1025px) 50vw, 100vw"
        className="object-cover object-center"
      />
    </figure>
  );
}
