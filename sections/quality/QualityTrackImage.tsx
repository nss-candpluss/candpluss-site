"use client";

import { SiteImage } from "@/components/ui/SiteImage";
import { useEffect, useRef, useState } from "react";

type QualityTrackImageProps = {
  src: string;
  alt: string;
  sizes?: string;
  onLoad?: () => void;
};

type ImageSlot = {
  src: string;
  alt: string;
  isVisible: boolean;
};

const imageFitClassName = "object-cover object-center";

const imageFadeClassName =
  "transition-opacity duration-[800ms] ease-out motion-reduce:transition-none";

function QualityTrackImageLayer({
  src,
  alt,
  sizes,
  isVisible,
  isTop,
  onLoad,
}: {
  src: string;
  alt: string;
  sizes: string;
  isVisible: boolean;
  isTop: boolean;
  onLoad?: () => void;
}) {
  return (
    <div
      className={`absolute inset-0 ${isTop ? "z-10" : "z-0"}`}
      aria-hidden={!isVisible}
    >
      <SiteImage
        src={src}
        alt={isVisible ? alt : ""}
        fill
        sizes={sizes}
        onLoad={onLoad}
        className={`${imageFitClassName} ${imageFadeClassName} ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}

export function QualityTrackImage({
  src,
  alt,
  sizes = "50vw",
  onLoad,
}: QualityTrackImageProps) {
  const [slots, setSlots] = useState<[ImageSlot, ImageSlot]>(() => [
    { src, alt, isVisible: true },
    { src, alt, isVisible: false },
  ]);
  const [activeSlotIndex, setActiveSlotIndex] = useState(0);
  const activeSlotRef = useRef(0);
  const displayedSrcRef = useRef(src);

  useEffect(() => {
    if (src === displayedSrcRef.current) {
      return;
    }

    const previousActive = activeSlotRef.current;
    const nextActive = 1 - previousActive;

    setSlots((previousSlots) => {
      const nextSlots = [...previousSlots] as [ImageSlot, ImageSlot];

      nextSlots[previousActive] = {
        ...nextSlots[previousActive],
        isVisible: false,
      };
      nextSlots[nextActive] = {
        src,
        alt,
        isVisible: false,
      };

      return nextSlots;
    });

    setActiveSlotIndex(nextActive);
    activeSlotRef.current = nextActive;
    displayedSrcRef.current = src;

    const frameId = requestAnimationFrame(() => {
      setSlots((previousSlots) => {
        const nextSlots = [...previousSlots] as [ImageSlot, ImageSlot];

        nextSlots[nextActive] = {
          ...nextSlots[nextActive],
          isVisible: true,
        };

        return nextSlots;
      });
    });

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [src, alt]);

  return (
    <div className="image-mask-frame absolute inset-0">
      {slots.map((slot, index) => (
        <QualityTrackImageLayer
          key={index}
          src={slot.src}
          alt={slot.alt}
          sizes={sizes}
          isVisible={slot.isVisible}
          isTop={index === activeSlotIndex}
          onLoad={index === activeSlotIndex ? onLoad : undefined}
        />
      ))}
    </div>
  );
}
