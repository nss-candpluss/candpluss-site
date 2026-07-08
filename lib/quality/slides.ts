import { qualitySections } from "@/data/quality";

type QualitySections = typeof qualitySections;

export type QualitySlide = {
  sectionIndex: number;
  sectionTitle: string;
  itemIndex: number;
  subtitle: string;
  body: string;
  image: string;
  imageAlt: string;
};

export function buildQualitySlides(sections: QualitySections): QualitySlide[] {
  return sections.flatMap((section, sectionIndex) =>
    section.items.map((item, itemIndex) => ({
      sectionIndex,
      sectionTitle: section.title,
      itemIndex,
      subtitle: item.subtitle,
      body: item.body,
      image: item.image,
      imageAlt: item.imageAlt,
    }))
  );
}

export function getQualityScrollDistance(
  slideCount: number,
  viewportHeight: number
): number {
  if (slideCount <= 1) {
    return 0;
  }

  return viewportHeight * (slideCount - 1);
}

export function getQualitySectionHeight(
  scrollDistance: number,
  viewportHeight: number
): number {
  return scrollDistance + viewportHeight;
}

export function getSlidePositionFromProgress(progress: number, slideCount: number): number {
  if (slideCount <= 1) {
    return 0;
  }

  const clampedProgress = Math.min(1, Math.max(0, progress));

  return clampedProgress * (slideCount - 1);
}

export function getSlideIndexFromProgress(progress: number, slideCount: number): number {
  return Math.round(getSlidePositionFromProgress(progress, slideCount));
}

/**
 * 現 slide のサブタイトル+本文が退場フェードで opacity 0 になる直前で次 slide の画像へ切り替える。
 * slidePosition が n + fadeEndRatio に達した時点で index n → n+1。
 */
export function getImageSlideIndexFromSlidePosition(
  slidePosition: number,
  slideCount: number,
  fadeEndRatio: number
): number {
  if (slideCount <= 1) {
    return 0;
  }

  const clampedPosition = Math.min(slideCount - 1, Math.max(0, slidePosition));
  const switchLead = 1 - fadeEndRatio;

  return Math.min(slideCount - 1, Math.floor(clampedPosition + switchLead));
}

export type SectionTitleBoundary = {
  sectionIndex: number;
  title: string;
  firstSlideIndex: number;
  lastSlideIndex: number;
};

export function buildSectionTitleBoundaries(slides: QualitySlide[]): SectionTitleBoundary[] {
  const boundaries: SectionTitleBoundary[] = [];

  for (let index = 0; index < slides.length; index += 1) {
    const slide = slides[index];
    const lastBoundary = boundaries[boundaries.length - 1];

    if (!lastBoundary || lastBoundary.sectionIndex !== slide.sectionIndex) {
      boundaries.push({
        sectionIndex: slide.sectionIndex,
        title: slide.sectionTitle,
        firstSlideIndex: index,
        lastSlideIndex: index,
      });
    } else {
      lastBoundary.lastSlideIndex = index;
    }
  }

  return boundaries;
}

/** 2セクション目以降の先頭 slide: 入場中はフレーム内タイトル、定位置は overlay */
export function shouldShowInFrameSectionTitle(slide: QualitySlide): boolean {
  return slide.sectionIndex > 0 && slide.itemIndex === 0;
}
