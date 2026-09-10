"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLayoutEffect, useRef } from "react";

import { Container } from "@/components/ui/Container";
import { SiteImage } from "@/components/ui/SiteImage";
import { laboAboutContent } from "@/data/labo";
import { subscribeMotionReady } from "@/lib/motion/motion-ready";
import { getScrollTriggerScroller } from "@/lib/motion/scroll-trigger-scroller";
import { bodyText, uiText } from "@/lib/typography";
import { LaboAboutGallery } from "@/sections/labo/LaboAboutGallery";

const DESKTOP_QUERY = "(min-width: 1025px)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const GALLERY_START_Y_PERCENT = 30;
const GALLERY_END_Y_PERCENT = 0;

export function LaboAbout() {
  const sectionRef = useRef<HTMLElement>(null);
  const { number, titleWrapSegments, label, bodyTitle, body, image, bodyImage } =
    laboAboutContent;

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const section = sectionRef.current;
    const gallery = section?.querySelector<HTMLElement>(
      "[data-labo-about-gallery]"
    );

    if (!section || !gallery) {
      return;
    }

    const desktop = window.matchMedia(DESKTOP_QUERY);
    const reducedMotion = window.matchMedia(REDUCED_MOTION_QUERY);
    let context: gsap.Context | null = null;
    let setupFrameId = 0;

    const setup = () => {
      context?.revert();
      context = null;

      context = gsap.context(() => {
        gsap.set(gallery, { yPercent: 0 });

        if (!desktop.matches || reducedMotion.matches) {
          return;
        }

        gsap.fromTo(
          gallery,
          { yPercent: GALLERY_START_Y_PERCENT },
          {
            yPercent: GALLERY_END_Y_PERCENT,
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
          }
        );
      }, section);

      ScrollTrigger.refresh();
    };

    const scheduleSetup = () => {
      cancelAnimationFrame(setupFrameId);
      setupFrameId = requestAnimationFrame(setup);
    };

    const unsubscribeMotionReady = subscribeMotionReady(scheduleSetup);
    desktop.addEventListener("change", scheduleSetup);
    reducedMotion.addEventListener("change", scheduleSetup);
    queueMicrotask(scheduleSetup);

    return () => {
      cancelAnimationFrame(setupFrameId);
      desktop.removeEventListener("change", scheduleSetup);
      reducedMotion.removeEventListener("change", scheduleSetup);
      unsubscribeMotionReady();
      context?.revert();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      data-header-theme="onLight"
      data-labo-about
      className="bg-[var(--background)] pt-[var(--container-y-top)] pb-[var(--container-y-bottom)]"
    >
      <Container>
        <div className="grid grid-cols-1 gap-y-0 min-[1025px]:grid-cols-2 min-[1025px]:grid-rows-[auto_auto_1fr] min-[1025px]:items-stretch min-[1025px]:gap-x-[calc(52px*var(--gap-scale-x))]">
          <div className="order-1 min-[1025px]:col-start-1 min-[1025px]:row-start-1">
            <h2
              className={`font-heading text-[var(--foreground)] ${uiText(48)}`}
            >
              <span className="concept-heading-numeral mb-[clamp(16px,calc(20px*var(--gap-scale-y)),20px)] block">
                {number}
              </span>
              <span className="flex flex-wrap gap-x-0 gap-y-[0.2em]">
                {titleWrapSegments.map((segment) => (
                  <span key={segment} className="whitespace-nowrap">
                    {segment}
                  </span>
                ))}
              </span>
            </h2>
            <p
              className={`mt-[clamp(10px,calc(16px*var(--gap-scale-y)),16px)] font-ui-en font-medium text-[var(--foreground)] opacity-[0.65] ${uiText(18)}`}
            >
              {label}
            </p>
          </div>

          <p
            className={`order-2 mt-[clamp(38px,calc(72px*var(--gap-scale-y)),72px)] font-body-ja font-bold text-[var(--foreground)] min-[1025px]:col-start-1 min-[1025px]:row-start-2 min-[1025px]:mt-[clamp(38px,calc(148px*var(--gap-scale-y)),148px)] ${uiText(21)}`}
          >
            {bodyTitle}
          </p>

          <div className="contents min-[1025px]:col-start-1 min-[1025px]:row-start-3 min-[1025px]:mt-[clamp(18px,calc(32px*var(--gap-scale-y)),32px)] min-[1025px]:block">
            <p
              className={`order-3 mt-[clamp(18px,calc(32px*var(--gap-scale-y)),32px)] font-body-ja text-[var(--foreground)] min-[1025px]:mt-0 ${bodyText(16)}`}
            >
              {body}
            </p>
            <figure className="relative order-5 mt-[clamp(38px,calc(102px*var(--gap-scale-y)),102px)] aspect-[13/10] overflow-hidden">
              <SiteImage
                src={bodyImage.src}
                alt={bodyImage.alt}
                fill
                sizes="(min-width: 1025px) 50vw, 100vw"
                className="object-cover object-center"
              />
            </figure>
          </div>

          <LaboAboutGallery
            src={image.src}
            alt={image.alt}
            className="order-4 mt-[calc(98px*var(--layout-scale-y))] aspect-[3/4] w-full min-w-0 min-[1025px]:col-start-2 min-[1025px]:row-start-1 min-[1025px]:row-span-3 min-[1025px]:mt-0 min-[1025px]:w-[80%] min-[1025px]:self-start min-[1025px]:ml-[calc((var(--container-x)+20%-calc(52px*var(--gap-scale-x)))/2)]"
          />
        </div>
      </Container>
    </section>
  );
}
