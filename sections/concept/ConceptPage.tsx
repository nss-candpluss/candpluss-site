"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLayoutEffect, useRef } from "react";

import { conceptContent } from "@/data/concept";
import { getConceptBackgroundMotion } from "@/data/concept-background-motion";
import { subscribeMotionReady } from "@/lib/motion/motion-ready";
import { getScrollTriggerScroller } from "@/lib/motion/scroll-trigger-scroller";
import {
  ConceptSectionContent,
  ConceptTopContent,
} from "@/sections/concept/ConceptContentBlock";
import { ConceptFeatureLinks } from "@/sections/concept/ConceptFeatureLinks";
import { ConceptLayeredBackground } from "@/sections/concept/ConceptLayeredBackground";

const SCROLLER = getScrollTriggerScroller();

/** 前セクション content shell 下端が viewport 上端からこの比率に到達したら、次セクションが画面下から見え始める */
const CONCEPT_REVEAL_BOTTOM_RATIO = 0.6;

const CONCEPT_ANIMATION = {
  enabled: true,
  fade: true,
  translate: false,
  /** viewport 下端からの距離（vh）。start までは opacity 0、start〜end で 0→1 */
  fadeRange: {
    start: 15,
    end: 30,
  },
  translateY: {
    logo: 16,
    heading: 20,
    body: 24,
  },
} as const;

type ConceptAnimationPart = keyof typeof CONCEPT_ANIMATION.translateY;

const CONCEPT_ANIMATION_PARTS: Array<{
  key: ConceptAnimationPart;
  selector: string;
}> = [
  { key: "logo", selector: ".concept-section-logo" },
  { key: "heading", selector: ".concept-section-heading" },
  { key: "body", selector: ".concept-section-body" },
];

const CONCEPT_SECTION_COUNT = 4;

const trackSpacerClassName = "shrink-0";

type ConceptTrackLayout = {
  leadingSpacer: number;
  sectionGap: number;
  scrollDistance: number;
  sectionHeight: number;
};

function buildConceptTrackLayout(
  contentHeights: number[],
  viewportHeight: number
): ConceptTrackLayout {
  const [topHeight, somethingHeight, satisfyHeight, sustainableHeight] = contentHeights;
  const sectionGap = viewportHeight * (1 - CONCEPT_REVEAL_BOTTOM_RATIO);
  const leadingSpacer = Math.max(0, viewportHeight / 2 - topHeight / 2);
  const scrollDistance =
    topHeight / 2 + sectionGap * 3 + somethingHeight + satisfyHeight + sustainableHeight / 2;

  return {
    leadingSpacer,
    sectionGap,
    scrollDistance,
    sectionHeight: scrollDistance + viewportHeight,
  };
}

function clearElementHeight(element: HTMLElement | null) {
  if (element) {
    element.style.height = "";
  }
}

function clearSectionScrollHeight(section: HTMLElement) {
  section.style.height = "";
}

function getConceptFadeViewportPosition(offsetVh: number) {
  return `top ${100 - offsetVh}%`;
}

function getConceptFadeScrollTriggerRange() {
  const { start, end } = CONCEPT_ANIMATION.fadeRange;

  return {
    start: getConceptFadeViewportPosition(start),
    end: getConceptFadeViewportPosition(end),
  };
}

function setupConceptSectionReveal(contentShell: HTMLDivElement) {
  if (!CONCEPT_ANIMATION.enabled || !CONCEPT_ANIMATION.fade) {
    return;
  }

  const fadeScrollTriggerRange = getConceptFadeScrollTriggerRange();

  for (const { selector } of CONCEPT_ANIMATION_PARTS) {
    const element = contentShell.querySelector<HTMLElement>(selector);

    if (!element) {
      continue;
    }

    gsap.set(element, { opacity: 0 });

    gsap.fromTo(
      element,
      { opacity: 0 },
      {
        opacity: 1,
        ease: "none",
        scrollTrigger: {
          trigger: element,
          scroller: SCROLLER,
          start: fadeScrollTriggerRange.start,
          end: fadeScrollTriggerRange.end,
          scrub: true,
          invalidateOnRefresh: true,
        },
      }
    );
  }
}

function setupConceptSectionReveals(sectionContentShells: HTMLDivElement[]) {
  for (const contentShell of sectionContentShells) {
    setupConceptSectionReveal(contentShell);
  }
}

export function ConceptPage() {
  const sectionRef = useRef<HTMLElement>(null);
  const stickyViewportRef = useRef<HTMLDivElement>(null);
  const contentTrackRef = useRef<HTMLDivElement>(null);
  const leadingSpacerRef = useRef<HTMLDivElement>(null);
  const sectionGapRefs = useRef<Array<HTMLDivElement | null>>([]);
  const topContentRef = useRef<HTMLDivElement>(null);
  const somethingContentRef = useRef<HTMLDivElement>(null);
  const satisfyContentRef = useRef<HTMLDivElement>(null);
  const sustainableContentRef = useRef<HTMLDivElement>(null);
  const skyRef = useRef<HTMLDivElement>(null);
  const mountainBackRef = useRef<HTMLDivElement>(null);
  const mountainMiddleRef = useRef<HTMLDivElement>(null);
  const hillRef = useRef<HTMLDivElement>(null);
  const grassRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const section = sectionRef.current;
    const stickyViewport = stickyViewportRef.current;
    const contentTrack = contentTrackRef.current;
    const leadingSpacer = leadingSpacerRef.current;
    const sky = skyRef.current;
    const sustainableContent = sustainableContentRef.current;

    const contentElements = [
      topContentRef.current,
      somethingContentRef.current,
      satisfyContentRef.current,
      sustainableContentRef.current,
    ].filter((element): element is HTMLDivElement => element !== null);

    if (
      !section ||
      !stickyViewport ||
      !contentTrack ||
      !leadingSpacer ||
      !sky ||
      !sustainableContent ||
      contentElements.length !== CONCEPT_SECTION_COUNT
    ) {
      return;
    }

    let context: gsap.Context | null = null;
    let trackLayout: ConceptTrackLayout | null = null;
    let isTrackReady = false;
    let setupFrameId = 0;
    let resizeFrameId = 0;

    const setupConceptScroll = () => {
      const viewportHeight = stickyViewport.clientHeight;
      const contentHeights = contentElements.map((element) => element.offsetHeight);

      if (viewportHeight === 0 || contentHeights.some((height) => height === 0)) {
        return false;
      }

      trackLayout = buildConceptTrackLayout(contentHeights, viewportHeight);

      const backgroundMotion = getConceptBackgroundMotion();

      leadingSpacer.style.height = `${trackLayout.leadingSpacer}px`;

      for (let index = 0; index < CONCEPT_SECTION_COUNT - 1; index += 1) {
        const gapElement = sectionGapRefs.current[index];
        if (gapElement) {
          gapElement.style.height = `${trackLayout.sectionGap}px`;
        }
      }

      section.style.height = `${trackLayout.sectionHeight}px`;

      context?.revert();
      context = null;

      const layerElements = {
        mountainBack: mountainBackRef.current,
        mountainMiddle: mountainMiddleRef.current,
        hill: hillRef.current,
        grass: grassRef.current,
      };

      gsap.set(sky, {
        x: backgroundMotion.sky.xStart,
        y: backgroundMotion.sky.yStart,
        force3D: true,
      });
      gsap.set(contentTrack, { y: 0, force3D: true });

      for (const motion of backgroundMotion.layers) {
        const element = layerElements[motion.key];
        if (element) {
          gsap.set(element, { y: motion.yStart, force3D: true });
        }
      }

      context = gsap.context(() => {
        const contentTimeline = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            scroller: SCROLLER,
            start: "top top",
            end: () => `+=${trackLayout?.scrollDistance ?? 0}`,
            scrub: true,
            invalidateOnRefresh: true,
          },
        });

        contentTimeline.fromTo(
          contentTrack,
          { y: 0 },
          {
            y: () => -(trackLayout?.scrollDistance ?? 0),
            ease: "none",
            duration: 1,
            force3D: true,
          },
          0
        );

        const backgroundTimeline = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            scroller: SCROLLER,
            start: "top top",
            endTrigger: sustainableContent,
            end: "center center",
            scrub: true,
            invalidateOnRefresh: true,
          },
        });

        backgroundTimeline.fromTo(
          sky,
          {
            x: backgroundMotion.sky.xStart,
            y: backgroundMotion.sky.yStart,
          },
          {
            x: backgroundMotion.sky.xEnd,
            y: backgroundMotion.sky.yEnd,
            ease: "none",
            duration: 1,
            force3D: true,
          },
          0
        );

        for (const motion of backgroundMotion.layers) {
          const element = layerElements[motion.key];

          if (element) {
            backgroundTimeline.fromTo(
              element,
              { y: motion.yStart },
              {
                y: motion.yEnd,
                ease: "none",
                duration: 1,
                force3D: true,
              },
              0
            );
          }
        }

        setupConceptSectionReveals(contentElements.slice(1));
      }, section);

      ScrollTrigger.refresh();

      if (!isTrackReady) {
        contentTrack.classList.remove("invisible");
        isTrackReady = true;
      }

      return true;
    };

    const scheduleSetup = () => {
      cancelAnimationFrame(setupFrameId);

      setupFrameId = requestAnimationFrame(() => {
        const isReady = setupConceptScroll();

        if (!isReady) {
          setupFrameId = requestAnimationFrame(() => {
            setupConceptScroll();
          });
        }
      });
    };

    const unsubscribeMotionReady = subscribeMotionReady(() => {
      scheduleSetup();
    });

    queueMicrotask(() => {
      scheduleSetup();
    });

    const resizeObserver = new ResizeObserver(() => {
      scheduleSetup();
    });

    resizeObserver.observe(stickyViewport);
    for (const element of contentElements) {
      resizeObserver.observe(element);
    }

    const gapElements = sectionGapRefs.current;

    const handleResize = () => {
      cancelAnimationFrame(resizeFrameId);
      resizeFrameId = requestAnimationFrame(() => {
        scheduleSetup();
      });
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(setupFrameId);
      cancelAnimationFrame(resizeFrameId);
      unsubscribeMotionReady();
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();
      context?.revert();
      clearSectionScrollHeight(section);
      clearElementHeight(leadingSpacer);
      contentTrack.classList.add("invisible");

      for (const gapElement of gapElements) {
        clearElementHeight(gapElement);
      }
    };
  }, []);

  return (
    <>
      <section ref={sectionRef} data-header-theme="onDark" className="relative bg-[#1a2430]">
      <div ref={stickyViewportRef} className="sticky top-0 h-svh overflow-hidden">
        <ConceptLayeredBackground
          skyRef={skyRef}
          mountainBackRef={mountainBackRef}
          mountainMiddleRef={mountainMiddleRef}
          hillRef={hillRef}
          grassRef={grassRef}
        />

        <div className="absolute inset-0 z-10 overflow-hidden">
          <div ref={contentTrackRef} className="invisible will-change-transform">
            <div ref={leadingSpacerRef} className={trackSpacerClassName} aria-hidden="true" />

            <ConceptTopContent ref={topContentRef} />

            <div
              ref={(element) => {
                sectionGapRefs.current[0] = element;
              }}
              className={trackSpacerClassName}
              aria-hidden="true"
            />

            <ConceptSectionContent
              ref={somethingContentRef}
              section={conceptContent.sections[0]}
            />

            <div
              ref={(element) => {
                sectionGapRefs.current[1] = element;
              }}
              className={trackSpacerClassName}
              aria-hidden="true"
            />

            <ConceptSectionContent ref={satisfyContentRef} section={conceptContent.sections[1]} />

            <div
              ref={(element) => {
                sectionGapRefs.current[2] = element;
              }}
              className={trackSpacerClassName}
              aria-hidden="true"
            />

            <ConceptSectionContent
              ref={sustainableContentRef}
              section={conceptContent.sections[2]}
            />
          </div>
        </div>
      </div>

      <div className="h-[var(--container-y-bottom)]" aria-hidden="true" />
      </section>

      <ConceptFeatureLinks />
    </>
  );
}
