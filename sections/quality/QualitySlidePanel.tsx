import type { RefObject } from "react";

import type { QualitySlide, SectionTitleBoundary } from "@/lib/quality/slides";
import {
  QualitySectionTitle,
  qualitySectionTitleHeaderClassName,
} from "@/sections/quality/QualityContentBlock";
import { QualitySlideTextFlow } from "@/sections/quality/QualitySlideTextFlow";
import { QualityTrackImage } from "@/sections/quality/QualityTrackImage";

type QualitySlidePanelProps = {
  slides: QualitySlide[];
  sectionTitleBoundaries: SectionTitleBoundary[];
  currentImageSlide: QualitySlide;
  titleContentRefs: RefObject<Array<HTMLDivElement | null>>;
  textClipRef: RefObject<HTMLDivElement | null>;
  textTrackRef: RefObject<HTMLDivElement | null>;
  textFrameRefs: RefObject<Array<HTMLDivElement | null>>;
  textContentRefs: RefObject<Array<HTMLDivElement | null>>;
};

export function QualitySlidePanel({
  slides,
  sectionTitleBoundaries,
  currentImageSlide,
  titleContentRefs,
  textClipRef,
  textTrackRef,
  textFrameRefs,
  textContentRefs,
}: QualitySlidePanelProps) {
  return (
    <div className="quality-slide-panel relative h-full min-h-0 max-[1025px]:isolate min-[1025px]:grid min-[1025px]:grid-cols-2">
      <div className="quality-slide-panel-text relative max-[1025px]:absolute max-[1025px]:inset-0 max-[1025px]:z-10 max-[1025px]:overflow-hidden min-[1025px]:h-full min-[1025px]:min-h-0 min-[1025px]:overflow-hidden min-[1025px]:text-[var(--foreground)]">
        <QualitySlideTextFlow
          slides={slides}
          textClipRef={textClipRef}
          textTrackRef={textTrackRef}
          textFrameRefs={textFrameRefs}
          textContentRefs={textContentRefs}
        />

        <div className="quality-title-clip pointer-events-none absolute inset-0 z-10 overflow-hidden">
          {sectionTitleBoundaries.map((boundary, index) => (
            <div
              key={boundary.sectionIndex}
              ref={(element) => {
                titleContentRefs.current[index] = element;
              }}
              className={`${qualitySectionTitleHeaderClassName} absolute inset-x-0 top-0 will-change-transform`}
            >
              <QualitySectionTitle title={boundary.title} />
            </div>
          ))}
        </div>
      </div>

      <div className="quality-slide-panel-image max-[1025px]:absolute max-[1025px]:inset-0 max-[1025px]:z-0 min-[1025px]:relative min-[1025px]:min-h-0 min-[1025px]:overflow-hidden min-[1025px]:bg-[var(--color-line)]">
        <QualityTrackImage
          src={currentImageSlide.image}
          alt={currentImageSlide.imageAlt}
          sizes="(min-width: 1025px) 50vw, 100vw"
        />
      </div>
    </div>
  );
}
