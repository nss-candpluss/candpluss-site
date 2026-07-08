import type { RefObject } from "react";

import type { QualitySlide } from "@/lib/quality/slides";
import { shouldShowInFrameSectionTitle } from "@/lib/quality/slides";
import {
  QualityItemContent,
  QualitySectionTitle,
  qualityItemContentPaddingClassName,
  qualitySectionTitleHeaderClassName,
} from "@/sections/quality/QualityContentBlock";

type QualitySlideTextFlowProps = {
  slides: QualitySlide[];
  textClipRef: RefObject<HTMLDivElement | null>;
  textTrackRef: RefObject<HTMLDivElement | null>;
  textFrameRefs: RefObject<Array<HTMLDivElement | null>>;
  textContentRefs: RefObject<Array<HTMLDivElement | null>>;
};

export function QualitySlideTextFlow({
  slides,
  textClipRef,
  textTrackRef,
  textFrameRefs,
  textContentRefs,
}: QualitySlideTextFlowProps) {
  return (
    <div ref={textClipRef} className="quality-text-clip absolute inset-0 overflow-hidden">
      <div ref={textTrackRef} data-quality-text-track className="will-change-transform">
        {slides.map((slide, index) => {
          const showInFrameSectionTitle = shouldShowInFrameSectionTitle(slide);

          return (
            <div
              key={`${slide.sectionTitle}-${slide.subtitle}-${index}`}
              ref={(element) => {
                textFrameRefs.current[index] = element;
              }}
              className={`quality-text-frame shrink-0 overflow-visible ${
                showInFrameSectionTitle
                  ? "flex flex-col"
                  : "flex flex-col justify-center"
              }`}
            >
              <div
                ref={(element) => {
                  textContentRefs.current[index] = element;
                }}
                data-quality-text-content
                className={`quality-text-frame-inner will-change-transform ${
                  showInFrameSectionTitle ? "flex h-full flex-col" : ""
                }`}
              >
                {showInFrameSectionTitle ? (
                  <>
                    <div
                      data-quality-in-frame-title
                      className={qualitySectionTitleHeaderClassName}
                    >
                      <QualitySectionTitle title={slide.sectionTitle} />
                    </div>
                    <div
                      className={`flex min-h-0 flex-1 flex-col justify-center overflow-visible ${qualityItemContentPaddingClassName}`}
                    >
                      <QualityItemContent subtitle={slide.subtitle} body={slide.body} />
                    </div>
                  </>
                ) : (
                  <div className={qualityItemContentPaddingClassName}>
                    <QualityItemContent subtitle={slide.subtitle} body={slide.body} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
