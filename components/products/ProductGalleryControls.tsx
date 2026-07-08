import { maskGraphicStyle } from "@/lib/maskStyle";

const iconMaskStyle = maskGraphicStyle;

type ProductGalleryControlsProps = {
  onPrevious: () => void;
  onNext: () => void;
  hasImages: boolean;
};

export function ProductGalleryControls({
  onPrevious,
  onNext,
  hasImages,
}: ProductGalleryControlsProps) {
  if (!hasImages) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        aria-label="Previous image"
        onClick={onPrevious}
        className="absolute top-1/2 left-[calc(32px*var(--gap-scale-x))] z-10 flex size-[38px] -translate-y-1/2 items-center justify-center bg-white/80 text-[var(--foreground)] min-[768px]:size-[48px]"
      >
        <span
          aria-hidden="true"
          className="block size-[19px] bg-current min-[768px]:size-[24px]"
          style={iconMaskStyle("/assets/icons/icon-gallery-prev.svg")}
        />
      </button>
      <button
        type="button"
        aria-label="Next image"
        onClick={onNext}
        className="absolute top-1/2 right-[calc(32px*var(--gap-scale-x))] z-10 flex size-[38px] -translate-y-1/2 items-center justify-center bg-white/80 text-[var(--foreground)] min-[768px]:size-[48px]"
      >
        <span
          aria-hidden="true"
          className="block size-[19px] bg-current min-[768px]:size-[24px]"
          style={iconMaskStyle("/assets/icons/icon-gallery-next.svg")}
        />
      </button>
    </>
  );
}
