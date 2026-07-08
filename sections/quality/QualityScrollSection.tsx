"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLayoutEffect, useMemo, useRef, useState } from "react";

import { qualitySections } from "@/data/quality";
import {
  buildQualitySlides,
  buildSectionTitleBoundaries,
  getImageSlideIndexFromSlidePosition,
  getQualityScrollDistance,
  getQualitySectionHeight,
  getSlideIndexFromProgress,
  getSlidePositionFromProgress,
} from "@/lib/quality/slides";
import {
  resetSectionTitleMotion,
  updateSectionTitleMotion,
} from "@/lib/quality/title-motion";
import {
  measureTextContentHeights,
  resetTextFrameMotion,
  updateTextFrameMotion,
} from "@/lib/quality/text-frame-motion";
import { getMotionRevision, subscribeMotionReady } from "@/lib/motion/motion-ready";
import { getScrollTriggerScroller } from "@/lib/motion/scroll-trigger-scroller";
import { QualitySlidePanel } from "@/sections/quality/QualitySlidePanel";

const SCROLLER = getScrollTriggerScroller();

/** 上部退場: フェード開始までの移動量（viewport 比率） */
const TEXT_FADE_START_RATIO = 0.12;
/** 上部退場: 完全透明になるまでの移動量（viewport 比率） */
const TEXT_FADE_END_RATIO = 0.3;

function clearElementHeight(element: HTMLElement | null) {
  if (element) {
    element.style.height = "";
  }
}

function applyTextFrameHeights(
  frameRefs: Array<HTMLDivElement | null>,
  frameHeight: number
) {
  for (const frame of frameRefs) {
    if (frame) {
      frame.style.height = `${frameHeight}px`;
    }
  }
}

export function QualityScrollSection() {
  const slides = useMemo(() => buildQualitySlides(qualitySections), []);
  const sectionTitleBoundaries = useMemo(
    () => buildSectionTitleBoundaries(slides),
    [slides]
  );
  const slideCount = slides.length;

  const sectionRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const textClipRef = useRef<HTMLDivElement>(null);
  const textTrackRef = useRef<HTMLDivElement>(null);
  const textFrameRefs = useRef<Array<HTMLDivElement | null>>([]);
  const textContentRefs = useRef<Array<HTMLDivElement | null>>([]);
  const titleContentRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [currentImageSlideIndex, setCurrentImageSlideIndex] = useState(0);

  const currentImageSlide = slides[currentImageSlideIndex] ?? slides[0];

  useLayoutEffect(() => {
    if (slideCount === 0) {
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const section = sectionRef.current;
    const viewport = viewportRef.current;
    const textClip = textClipRef.current;
    const textTrack = textTrackRef.current;

    if (!section || !viewport || !textClip || !textTrack) {
      return;
    }

    let context: gsap.Context | null = null;
    let motionRevision = getMotionRevision();
    let resizeFrameId = 0;
    let setupFrameId = 0;

    const setupQualityScroll = () => {
      const viewportHeight = viewport.clientHeight;

      if (viewportHeight === 0) {
        return false;
      }

      const scrollDistance = getQualityScrollDistance(slideCount, viewportHeight);
      const sectionHeight = getQualitySectionHeight(scrollDistance, viewportHeight);
      const fadeStartDelay = viewportHeight * TEXT_FADE_START_RATIO;
      const fadeEndAt = viewportHeight * TEXT_FADE_END_RATIO;
      const contentHeights = measureTextContentHeights(textContentRefs.current);

      section.style.height = `${sectionHeight}px`;
      applyTextFrameHeights(textFrameRefs.current, viewportHeight);

      context?.revert();
      context = null;

      const applyTextMotion = (progress: number) => {
        const slidePosition = getSlidePositionFromProgress(progress, slideCount);
        const trackY = updateTextFrameMotion({
          slides,
          frameRefs: textFrameRefs.current,
          contentRefs: textContentRefs.current,
          contentHeights,
          slidePosition,
          frameHeight: viewportHeight,
          fadeStartRatio: TEXT_FADE_START_RATIO,
          fadeStartDelay,
          fadeEndAt,
        });

        gsap.set(textTrack, { y: trackY, force3D: true });
        updateSectionTitleMotion({
          titleContentRefs: titleContentRefs.current,
          boundaries: sectionTitleBoundaries,
          slidePosition,
          slideCount,
          frameHeight: viewportHeight,
          fadeStartDelay,
          fadeEndAt,
        });
        setCurrentSlideIndex(getSlideIndexFromProgress(progress, slideCount));
        setCurrentImageSlideIndex(
          getImageSlideIndexFromSlidePosition(
            slidePosition,
            slideCount,
            TEXT_FADE_END_RATIO
          )
        );
      };

      applyTextMotion(0);

      if (scrollDistance > 0) {
        context = gsap.context(() => {
          ScrollTrigger.create({
            trigger: section,
            scroller: SCROLLER,
            start: "top top",
            end: () => `+=${scrollDistance}`,
            scrub: true,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              applyTextMotion(self.progress);
            },
          });
        }, section);
      } else {
        setCurrentSlideIndex(0);
        setCurrentImageSlideIndex(0);
      }

      if (process.env.NODE_ENV === "development") {
        section.dataset.qualitySlideCount = String(slideCount);
        section.dataset.qualityScrollDistance = String(scrollDistance);
        section.dataset.qualitySectionHeight = String(sectionHeight);
        section.dataset.qualityTextFrameHeight = String(viewportHeight);
        section.dataset.qualityMotionRevision = String(motionRevision);
      }

      ScrollTrigger.refresh();

      return true;
    };

    const scheduleSetup = () => {
      cancelAnimationFrame(setupFrameId);

      setupFrameId = requestAnimationFrame(() => {
        const isReady = setupQualityScroll();

        if (!isReady) {
          setupFrameId = requestAnimationFrame(() => {
            setupQualityScroll();
          });
        }
      });
    };

    const unsubscribeMotionReady = subscribeMotionReady((nextMotionRevision) => {
      motionRevision = nextMotionRevision;
      scheduleSetup();
    });

    queueMicrotask(() => {
      scheduleSetup();
    });

    const handleResize = () => {
      cancelAnimationFrame(resizeFrameId);
      resizeFrameId = requestAnimationFrame(() => {
        scheduleSetup();
      });
    };

    window.addEventListener("resize", handleResize);

    const textFrameElements = textFrameRefs.current;
    const textContentElements = textContentRefs.current;
    const titleContentElements = titleContentRefs.current;

    return () => {
      cancelAnimationFrame(setupFrameId);
      cancelAnimationFrame(resizeFrameId);
      window.removeEventListener("resize", handleResize);
      unsubscribeMotionReady();
      context?.revert();
      section.style.height = "";

      for (const frame of textFrameElements) {
        clearElementHeight(frame);
      }

      resetTextFrameMotion(textFrameElements, textContentElements);
      resetSectionTitleMotion(titleContentElements);

      if (process.env.NODE_ENV === "development") {
        delete section.dataset.qualitySlideCount;
        delete section.dataset.qualityScrollDistance;
        delete section.dataset.qualitySectionHeight;
        delete section.dataset.qualityTextFrameHeight;
        delete section.dataset.qualityMotionRevision;
      }
    };
  }, [sectionTitleBoundaries, slideCount, slides]);

  if (!currentImageSlide) {
    return null;
  }

  return (
    <section
      ref={sectionRef}
      data-header-theme="onLight"
      data-quality-current-slide={currentSlideIndex}
      className="quality-scroll-section relative bg-[var(--background)]"
    >
      <div ref={viewportRef} className="sticky top-0 h-[calc(var(--app-vh)*100)] w-full overflow-hidden">
        <QualitySlidePanel
          slides={slides}
          sectionTitleBoundaries={sectionTitleBoundaries}
          currentImageSlide={currentImageSlide}
          titleContentRefs={titleContentRefs}
          textClipRef={textClipRef}
          textTrackRef={textTrackRef}
          textFrameRefs={textFrameRefs}
          textContentRefs={textContentRefs}
        />
      </div>

      <div className="h-[var(--container-y-bottom)] shrink-0" aria-hidden="true" />
    </section>
  );
}
