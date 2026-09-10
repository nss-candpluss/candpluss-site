"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLayoutEffect, useRef } from "react";

import { SiteImage } from "@/components/ui/SiteImage";
import { Container } from "@/components/ui/Container";
import { laboDesignContent } from "@/data/labo";
import { subscribeMotionReady } from "@/lib/motion/motion-ready";
import { getScrollTriggerScroller } from "@/lib/motion/scroll-trigger-scroller";
import { bodyText, uiText } from "@/lib/typography";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const BACKGROUND_END_SCALE = 1.1;

export function LaboDesign() {
  const sectionRef = useRef<HTMLElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const { number, titleLead, titleWrapSegments, label, body, image } =
    laboDesignContent;

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const section = sectionRef.current;
    const backgroundImage = imageRef.current;

    if (!section || !backgroundImage) {
      return;
    }

    const reducedMotion = window.matchMedia(REDUCED_MOTION_QUERY);
    let context: gsap.Context | null = null;
    let setupFrameId = 0;

    const setup = () => {
      context?.revert();
      context = null;

      context = gsap.context(() => {
        gsap.set(backgroundImage, { scale: 1 });

        if (reducedMotion.matches) {
          return;
        }

        gsap.to(backgroundImage, {
          scale: BACKGROUND_END_SCALE,
          transformOrigin: "center center",
          ease: "none",
          force3D: true,
          scrollTrigger: {
            trigger: section,
            scroller: getScrollTriggerScroller(),
            start: "top bottom",
            end: "bottom top",
            scrub: true,
            invalidateOnRefresh: true,
          },
        });
      }, section);

      ScrollTrigger.refresh();
    };

    const scheduleSetup = () => {
      cancelAnimationFrame(setupFrameId);
      setupFrameId = requestAnimationFrame(setup);
    };

    const unsubscribeMotionReady = subscribeMotionReady(scheduleSetup);
    reducedMotion.addEventListener("change", scheduleSetup);
    queueMicrotask(scheduleSetup);

    return () => {
      cancelAnimationFrame(setupFrameId);
      reducedMotion.removeEventListener("change", scheduleSetup);
      unsubscribeMotionReady();
      context?.revert();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      data-header-theme="onDark"
      data-labo-design
      className="relative isolate overflow-hidden bg-black pt-[var(--container-y-top)] pb-[clamp(82px,calc(82px+(100vw-390px)/(1920px-390px)*102px),184px)] text-white"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 z-0 h-full aspect-[3/2] overflow-hidden min-[1025px]:left-auto min-[1025px]:right-0"
      >
        <div
          ref={imageRef}
          data-labo-design-background-image
          className="absolute inset-0 will-change-transform"
        >
          <SiteImage
            src={image}
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-left min-[1025px]:object-right"
          />
        </div>
      </div>

      <Container className="relative z-10">
        <div className="w-full min-[1025px]:max-w-[720px]">
          <h2 className={`font-heading ${uiText(48)}`}>
            <span className="concept-heading-numeral mb-[clamp(16px,calc(20px*var(--gap-scale-y)),20px)] block">
              {number}
            </span>
            <span className="flex flex-col gap-y-[0.2em]">
              <span className="whitespace-nowrap">{titleLead}</span>
              <span className="flex flex-wrap gap-x-0 gap-y-[0.2em]">
                {titleWrapSegments.map((segment) => (
                  <span key={segment} className="whitespace-nowrap">
                    {segment}
                  </span>
                ))}
              </span>
            </span>
          </h2>
          <p
            className={`mt-[clamp(10px,calc(16px*var(--gap-scale-y)),16px)] font-ui-en font-medium opacity-[0.65] ${uiText(18)}`}
          >
            {label}
          </p>
          <p
            className={`mt-[clamp(38px,calc(72px*var(--gap-scale-y)),72px)] font-body-ja ${bodyText(16)}`}
          >
            {body}
          </p>
        </div>
      </Container>
    </section>
  );
}
