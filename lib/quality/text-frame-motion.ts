import gsap from "gsap";

import type { QualitySlide } from "@/lib/quality/slides";
import { shouldShowInFrameSectionTitle } from "@/lib/quality/slides";

/**
 * 次 slide のテキスト全体が clip 下端より下（画面外）に来る inner Y。
 * relativePosition に応じて待機位置を更新し、フレームが上がっても画面外を維持する。
 */
export function getEnterStartInnerYOffset(
  frameHeight: number,
  contentHeight: number,
  relativePosition: number
): number {
  const frameTop = relativePosition * frameHeight;

  return frameHeight - frameTop - frameHeight / 2 + contentHeight / 2;
}

export type SlideContentMotion = {
  opacity: number;
  innerY: number;
};

/** 単一 slide の opacity / inner Y */
export function getSlideContentMotion(
  index: number,
  slidePosition: number,
  frameHeight: number,
  contentHeight: number,
  fadeStartRatio: number,
  fadeStartDelay: number,
  fadeEndAt: number
): SlideContentMotion {
  const enterThreshold = 1 - fadeStartRatio;
  const relativePosition = index - slidePosition;
  const frameTop = relativePosition * frameHeight;
  const enterStartInnerY = getEnterStartInnerYOffset(
    frameHeight,
    contentHeight,
    enterThreshold
  );

  if (relativePosition > enterThreshold) {
    return {
      opacity: 0,
      innerY: getEnterStartInnerYOffset(frameHeight, contentHeight, relativePosition),
    };
  }

  if (relativePosition > 0 && relativePosition <= enterThreshold) {
    const enterProgress = 1 - relativePosition / enterThreshold;

    return {
      opacity: 1,
      innerY: enterStartInnerY * (1 - enterProgress),
    };
  }

  if (relativePosition < -1) {
    return { opacity: 0, innerY: 0 };
  }

  if (relativePosition < 0) {
    if (frameTop < -fadeStartDelay) {
      return {
        opacity:
          frameTop <= -fadeEndAt
            ? 0
            : (fadeEndAt + frameTop) / (fadeEndAt - fadeStartDelay),
        innerY: 0,
      };
    }

    return { opacity: 1, innerY: 0 };
  }

  return { opacity: 1, innerY: 0 };
}

type UpdateTextFrameMotionOptions = {
  slides: QualitySlide[];
  frameRefs: Array<HTMLDivElement | null>;
  contentRefs: Array<HTMLDivElement | null>;
  contentHeights: number[];
  slidePosition: number;
  frameHeight: number;
  fadeStartRatio: number;
  fadeStartDelay: number;
  fadeEndAt: number;
};

/** scroll 連動でテキストフレームの opacity / inner Y を更新 */
export function updateTextFrameMotion({
  slides,
  frameRefs,
  contentRefs,
  contentHeights,
  slidePosition,
  frameHeight,
  fadeStartRatio,
  fadeStartDelay,
  fadeEndAt,
}: UpdateTextFrameMotionOptions): number {
  for (let index = 0; index < frameRefs.length; index += 1) {
    const frame = frameRefs[index];
    const content = contentRefs[index];
    const slide = slides[index];

    if (!frame || !content) {
      continue;
    }

    const contentHeight = contentHeights[index] ?? content.offsetHeight;
    const { opacity, innerY } = getSlideContentMotion(
      index,
      slidePosition,
      frameHeight,
      contentHeight,
      fadeStartRatio,
      fadeStartDelay,
      fadeEndAt
    );

    gsap.set(frame, { opacity: 1 });
    gsap.set(content, {
      y: innerY,
      opacity,
      zIndex: index + 1,
      force3D: true,
    });

    if (slide && shouldShowInFrameSectionTitle(slide)) {
      const inFrameTitle = frame.querySelector<HTMLElement>("[data-quality-in-frame-title]");
      const firstSlideRel = index - slidePosition;

      if (inFrameTitle) {
        gsap.set(inFrameTitle, {
          opacity: firstSlideRel > 0 ? opacity : 0,
          force3D: true,
        });
      }
    }
  }

  return -slidePosition * frameHeight;
}

export function measureTextContentHeights(
  contentRefs: Array<HTMLDivElement | null>
): number[] {
  return contentRefs.map((content) => content?.offsetHeight ?? 0);
}

export function resetTextFrameMotion(
  frameRefs: Array<HTMLDivElement | null>,
  contentRefs: Array<HTMLDivElement | null>
) {
  for (const frame of frameRefs) {
    if (frame) {
      gsap.set(frame, { clearProps: "opacity" });

      const inFrameTitle = frame.querySelector<HTMLElement>("[data-quality-in-frame-title]");

      if (inFrameTitle) {
        gsap.set(inFrameTitle, { clearProps: "opacity,transform" });
      }
    }
  }

  for (const content of contentRefs) {
    if (content) {
      gsap.set(content, { clearProps: "opacity,transform,zIndex" });
    }
  }
}
