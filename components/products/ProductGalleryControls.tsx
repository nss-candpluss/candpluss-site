type ProductGalleryControlsProps = {
  onPrevious: () => void;
  onNext: () => void;
  hasImages: boolean;
};

export function ProductGalleryChevron({
  direction,
}: {
  direction: "left" | "right";
}) {
  return (
    <span
      aria-hidden="true"
      className={`block size-[8px] border-t-[1.5px] border-l-[1.5px] border-current ${
        direction === "left"
          ? "-rotate-45 translate-x-[2px]"
          : "rotate-135 -translate-x-[2px]"
      }`}
    />
  );
}

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
        className="absolute top-1/2 left-[calc(32px*var(--gap-scale-x))] z-10 flex size-[48px] -translate-y-1/2 items-center justify-center rounded-full border border-[#ccc] bg-white/80 text-[var(--foreground)]"
      >
        <ProductGalleryChevron direction="left" />
      </button>
      <button
        type="button"
        aria-label="Next image"
        onClick={onNext}
        className="absolute top-1/2 right-[calc(32px*var(--gap-scale-x))] z-10 flex size-[48px] -translate-y-1/2 items-center justify-center rounded-full border border-[#ccc] bg-white/80 text-[var(--foreground)]"
      >
        <ProductGalleryChevron direction="right" />
      </button>
    </>
  );
}
