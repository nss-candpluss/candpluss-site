"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLayoutEffect, useRef } from "react";

import { Container } from "@/components/ui/Container";
import { MaskedImage } from "@/components/ui/MaskedImage";
import { laboActivitiesContent } from "@/data/labo";
import { subscribeMotionReady } from "@/lib/motion/motion-ready";
import { getScrollTriggerScroller } from "@/lib/motion/scroll-trigger-scroller";
import { bodyText, uiText } from "@/lib/typography";

const DESKTOP_QUERY = "(min-width: 1025px)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const LEFT_END_Y_PERCENT = 5;
const RIGHT_START_Y_PERCENT = 10;

export function LaboActivities() {
  const sectionRef = useRef<HTMLElement>(null);
  const { number, titleWrapSegments, label, items } = laboActivitiesContent;
  const featuredItem = items[0];
  const secondItem = items[1];
  const thirdItem = items[2];

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const section = sectionRef.current;
    const left = section?.querySelector<HTMLElement>(
      "[data-labo-activities-left]"
    );
    const right = section?.querySelector<HTMLElement>(
      "[data-labo-activities-right]"
    );

    if (!section || !left || !right) {
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
        gsap.set([left, right], { yPercent: 0 });

        if (!desktop.matches || reducedMotion.matches) {
          return;
        }

        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            scroller: getScrollTriggerScroller(),
            start: "top bottom",
            end: "bottom top",
            scrub: true,
            invalidateOnRefresh: true,
          },
        });

        timeline
          .to(
            left,
            {
              yPercent: LEFT_END_Y_PERCENT,
              ease: "none",
              force3D: true,
            },
            0
          )
          .fromTo(
            right,
            { yPercent: RIGHT_START_Y_PERCENT },
            {
              yPercent: 0,
              ease: "none",
              force3D: true,
            },
            0
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
      data-labo-activities
      className="bg-[var(--background)] pb-[var(--container-y-bottom)] [--labo-activities-inset:clamp(38px,calc(102px*var(--gap-scale-y)),102px)]"
    >
      <Container>
        <div className="grid grid-cols-1 gap-y-0 min-[1025px]:grid-cols-2 min-[1025px]:items-start min-[1025px]:gap-x-[var(--labo-activities-inset)] min-[1025px]:pl-[calc(var(--labo-activities-inset)-var(--container-x))] min-[1025px]:pr-[calc(var(--labo-activities-inset)-var(--container-x))]">
          <div
            data-labo-activities-left
            className="contents min-[1025px]:col-start-1 min-[1025px]:block"
          >
            <div className="order-1">
              <div className="min-[1025px]:-ml-[calc(var(--labo-activities-inset)-var(--container-x))]">
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
            </div>
            {featuredItem ? (
              <>
                <div className="order-3">
                  <p
                    className={`mt-[clamp(38px,calc(102px*var(--gap-scale-y)),102px)] font-body-ja font-bold text-[var(--foreground)] min-[1025px]:mt-[clamp(38px,calc(148px*var(--gap-scale-y)),148px)] ${uiText(21)}`}
                  >
                    {featuredItem.title}
                  </p>
                  <p
                    className={`mt-[clamp(18px,calc(32px*var(--gap-scale-y)),32px)] font-body-ja text-[var(--foreground)] ${bodyText(16)}`}
                  >
                    {featuredItem.body}
                  </p>
                </div>
                <MaskedImage
                  src={featuredItem.image}
                  alt=""
                  aspectClassName="aspect-[13/10]"
                  containerClassName="order-4 mt-[clamp(38px,calc(102px*var(--gap-scale-y)),102px)] bg-[var(--color-line)]"
                  sizes="(min-width: 1025px) 50vw, 100vw"
                />
              </>
            ) : null}
            {thirdItem ? (
              <div className="order-7">
                <p
                  className={`mt-[clamp(38px,calc(102px*var(--gap-scale-y)),102px)] font-body-ja font-bold text-[var(--foreground)] ${uiText(21)}`}
                >
                  {thirdItem.title}
                </p>
                <p
                  className={`mt-[clamp(18px,calc(32px*var(--gap-scale-y)),32px)] font-body-ja text-[var(--foreground)] ${bodyText(16)}`}
                >
                  {thirdItem.body}
                </p>
              </div>
            ) : null}
          </div>

          <div
            data-labo-activities-right
            className="contents min-[1025px]:col-start-2 min-[1025px]:block"
          >
            {secondItem ? (
              <>
                <MaskedImage
                  src={secondItem.image}
                  alt=""
                  aspectClassName="aspect-[13/10]"
                  containerClassName="order-2 mt-[calc(98px*var(--layout-scale-y))] bg-[var(--color-line)] min-[1025px]:mt-0"
                  sizes="(min-width: 1025px) 50vw, 100vw"
                />
                <div className="order-5">
                  <h3
                    className={`mt-[clamp(38px,calc(102px*var(--gap-scale-y)),102px)] min-w-0 font-body-ja font-bold text-[var(--foreground)] ${uiText(21)}`}
                  >
                    {secondItem.title}
                  </h3>
                  <p
                    className={`mt-[clamp(18px,calc(32px*var(--gap-scale-y)),32px)] font-body-ja text-[var(--foreground)] ${bodyText(16)}`}
                  >
                    {secondItem.body}
                  </p>
                </div>
              </>
            ) : null}
            {thirdItem ? (
              <MaskedImage
                src={thirdItem.image}
                alt=""
                aspectClassName="aspect-[13/10]"
                containerClassName="order-6 mt-[clamp(38px,calc(102px*var(--gap-scale-y)),102px)] bg-[var(--color-line)]"
                sizes="(min-width: 1025px) 50vw, 100vw"
              />
            ) : null}
          </div>
        </div>
      </Container>
    </section>
  );
}
