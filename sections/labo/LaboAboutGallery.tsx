"use client";

import { useState } from "react";

import { ProductGalleryControls } from "@/components/products/ProductGalleryControls";
import { SiteImage } from "@/components/ui/SiteImage";

type AboutImage = {
  src: string;
  alt: string;
};

type LaboAboutGalleryProps = {
  images: readonly AboutImage[];
  className?: string;
};

export function LaboAboutGallery({ images, className = "" }: LaboAboutGalleryProps) {
  const [index, setIndex] = useState(0);
  const count = images.length;
  const current = images[index];

  if (!current) {
    return null;
  }

  const goPrevious = () => {
    setIndex((currentIndex) => (currentIndex - 1 + count) % count);
  };

  const goNext = () => {
    setIndex((currentIndex) => (currentIndex + 1) % count);
  };

  return (
    <figure className={`relative overflow-hidden ${className}`.trim()}>
      {images.map((image, imageIndex) => (
        <SiteImage
          key={image.src}
          src={image.src}
          alt={imageIndex === index ? image.alt : ""}
          fill
          sizes="(min-width: 1025px) 50vw, 100vw"
          className={`object-cover object-center transition-opacity duration-500 ease-out ${
            imageIndex === index ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
      <ProductGalleryControls
        onPrevious={goPrevious}
        onNext={goNext}
        hasImages={count > 1}
      />
    </figure>
  );
}
