import gsap from "gsap";

import type { SectionTitleBoundary } from "@/lib/quality/slides";

type UpdateSectionTitleMotionOptions = {
  titleContentRefs: Array<HTMLDivElement | null>;
  boundaries: SectionTitleBoundary[];
  slidePosition: number;
  slideCount: number;
  frameHeight: number;
  fadeStartDelay: number;
  fadeEndAt: number;
};

/**
 * 1セクション目: overlay タイトル（退場は last slide に同期）
 * 2セクション目以降: 入場中はフレーム内タイトル、定位置は overlay のみ表示
 */
export function updateSectionTitleMotion({
  titleContentRefs,
  boundaries,
  slidePosition,
  slideCount,
  frameHeight,
  fadeStartDelay,
  fadeEndAt,
}: UpdateSectionTitleMotionOptions): void {
  for (let index = 0; index < boundaries.length; index += 1) {
    const boundary = boundaries[index];
    const titleContent = titleContentRefs[index];

    if (!boundary || !titleContent) {
      continue;
    }

    const { firstSlideIndex, lastSlideIndex } = boundary;
    const isFirstSection = firstSlideIndex === 0;
    const isLastSection = lastSlideIndex === slideCount - 1;
    const firstSlideRel = firstSlideIndex - slidePosition;
    const lastSlideRel = lastSlideIndex - slidePosition;

    let opacity = 0;
    let y = 0;

    if (isFirstSection) {
      if (slidePosition < lastSlideIndex) {
        opacity = 1;
        y = 0;
      } else if (slidePosition >= lastSlideIndex && lastSlideRel <= 0) {
        const frameTop = lastSlideRel * frameHeight;

        if (frameTop < -fadeStartDelay) {
          opacity =
            frameTop <= -fadeEndAt
              ? 0
              : (fadeEndAt + frameTop) / (fadeEndAt - fadeStartDelay);
        } else {
          opacity = 1;
        }

        y = lastSlideRel * frameHeight;
      }
    } else if (firstSlideRel <= 0 && (isLastSection || slidePosition < lastSlideIndex)) {
      opacity = 1;
      y = 0;
    }

    gsap.set(titleContent, {
      y,
      opacity,
      zIndex: index + 1,
      force3D: true,
    });
  }
}

export function resetSectionTitleMotion(titleContentRefs: Array<HTMLDivElement | null>) {
  for (const content of titleContentRefs) {
    if (content) {
      gsap.set(content, { clearProps: "opacity,transform,zIndex" });
    }
  }
}
