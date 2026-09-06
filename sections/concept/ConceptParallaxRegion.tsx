"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLayoutEffect, useRef, type ReactNode } from "react";

import { subscribeMotionReady } from "@/lib/motion/motion-ready";
import { getScrollTriggerScroller } from "@/lib/motion/scroll-trigger-scroller";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const PARALLAX_DISTANCE_RATIO = 0.06;
const PARALLAX_DISTANCE_MIN = 24;
const PARALLAX_DISTANCE_MAX = 64;
const INTRO_CHARACTER_STAGGER = 0.06;
const INTRO_MENU_STAGGER = 0.09;
const NUMBER_REVEAL_DELAY = 0.3;
const BACKGROUND_CLOSEUP_SCALE = 1.16;
const BACKGROUND_WIDE_SCALE = 1;

function getParallaxDistance(): number {
  return Math.min(
    PARALLAX_DISTANCE_MAX,
    Math.max(PARALLAX_DISTANCE_MIN, window.innerHeight * PARALLAX_DISTANCE_RATIO)
  );
}

type ConceptParallaxRegionProps = {
  children: ReactNode;
  className?: string;
};

export function ConceptParallaxRegion({
  children,
  className = "",
}: ConceptParallaxRegionProps) {
  const regionRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const region = regionRef.current;
    if (!region) {
      return;
    }

    const reducedMotion = window.matchMedia(REDUCED_MOTION_QUERY);
    let context: gsap.Context | null = null;
    let introCompleted = false;
    let outroRevealed = false;
    let outroPositionLocked = false;
    const revealedStoryIndexes = new Set<number>();
    let setupFrameId = 0;

    const setup = () => {
      context?.revert();
      context = null;

      const sections = gsap.utils.toArray<HTMLElement>(
        "[data-concept-section]",
        region
      );
      const backgrounds = gsap.utils.toArray<HTMLElement>(
        "[data-concept-background]",
        region
      );
      const foregrounds = gsap.utils.toArray<HTMLElement>(
        "[data-concept-parallax]",
        region
      );
      const introBlack = region.querySelector<HTMLElement>(
        "[data-concept-intro-black]"
      );
      const introMenuItems = gsap.utils.toArray<HTMLElement>(
        "[data-concept-intro-menu-item]",
        region
      );
      const outro = region.querySelector<HTMLElement>("[data-concept-outro]");

      context = gsap.context(() => {
        gsap.set(backgrounds, {
          opacity: 0,
          scale: 1,
          xPercent: 0,
          yPercent: 0,
        });
        gsap.set(backgrounds[0], { opacity: 1 });
        gsap.set(foregrounds, { clearProps: "transform,opacity" });

        const getStoryTargets = (section: HTMLElement) => ({
          titleCharacters: gsap.utils.toArray<HTMLElement>(
            "[data-concept-intro-title-character]",
            section
          ),
          numberCharacters: gsap.utils.toArray<HTMLElement>(
            "[data-concept-intro-number-character]",
            section
          ),
          rule: section.querySelector<HTMLElement>("[data-concept-intro-rule]"),
          label: section.querySelector<HTMLElement>("[data-concept-intro-label]"),
          body: section.querySelector<HTMLElement>("[data-concept-intro-body]"),
        });
        const outroTitle =
          outro?.querySelector<HTMLElement>("[data-concept-outro-title]") ??
          null;
        const outroTitlePin =
          outro?.querySelector<HTMLElement>(
            "[data-concept-outro-title-pin]"
          ) ?? null;
        const outroTitleLogo =
          outro?.querySelector<HTMLElement>("[data-concept-outro-logo]") ??
          null;
        const lastSection = sections[sections.length - 1];

        const keepOutroTitleAtViewportCenter = () => {
          if (outroPositionLocked || !outro || !outroTitlePin) {
            return;
          }

          const viewportCenter = window.innerHeight / 2;
          const outroRect = outro.getBoundingClientRect();
          const outroCenter = outroRect.top + outroRect.height / 2;
          gsap.set(outroTitlePin, { y: viewportCenter - outroCenter });
        };

        const lockOutroTitlePosition = () => {
          outroPositionLocked = true;
          gsap.set(outroTitlePin, { clearProps: "transform" });
        };

        const revealStoryImmediately = (
          targets: ReturnType<typeof getStoryTargets>
        ) => {
          gsap.set(
            [
              ...targets.titleCharacters,
              ...targets.numberCharacters,
              targets.rule,
              targets.label,
              targets.body,
            ].filter(Boolean),
            { clearProps: "opacity,transform,filter,visibility" }
          );
        };

        const setStoryInitialState = (
          targets: ReturnType<typeof getStoryTargets>
        ) => {
          const getRuleStartX = () => {
            if (!targets.rule?.parentElement) {
              return -48;
            }

            const indexWidth =
              targets.rule.parentElement.getBoundingClientRect().width;
            const ruleWidth = targets.rule.getBoundingClientRect().width;
            return -(indexWidth - ruleWidth);
          };

          gsap.set(targets.titleCharacters, {
            opacity: 0,
            filter: "blur(4px)",
          });
          gsap.set(targets.numberCharacters, { opacity: 0, y: "0.6em" });
          gsap.set(targets.rule, { opacity: 0, x: getRuleStartX });
          gsap.set(targets.label, { opacity: 0 });
          gsap.set(targets.body, { opacity: 0, y: 32 });
        };

        const appendStoryReveal = (
          timeline: gsap.core.Timeline,
          targets: ReturnType<typeof getStoryTargets>
        ) => {
          timeline
            .addLabel("titleStart")
            .to(
              targets.titleCharacters,
              {
                opacity: 1,
                filter: "blur(0px)",
                duration: 0.7,
                stagger: INTRO_CHARACTER_STAGGER,
                ease: "power2.out",
              },
              "titleStart"
            )
            .set(
              targets.rule,
              { opacity: 1 },
              `titleStart+=${NUMBER_REVEAL_DELAY}`
            )
            .to(
              targets.rule,
              {
                x: 0,
                duration: 0.65,
                ease: "power2.inOut",
              },
              `titleStart+=${NUMBER_REVEAL_DELAY}`
            )
            .to(
              targets.numberCharacters,
              {
                opacity: 1,
                y: 0,
                duration: 0.45,
                stagger: 0.12,
              },
              ">"
            )
            .addLabel("copyStart", ">+0.12")
            .to(
              targets.label,
              { opacity: 0.65, duration: 0.7, ease: "sine.out" },
              "copyStart"
            )
            .to(
              targets.body,
              { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" },
              "copyStart+=0.25"
            );

          return timeline;
        };

        const firstSection = sections[0];
        const firstStoryTargets = firstSection
          ? getStoryTargets(firstSection)
          : null;

        if (reducedMotion.matches) {
          introCompleted = true;
          gsap.set(introBlack, { autoAlpha: 0 });
          sections.forEach((section, index) => {
            revealStoryImmediately(getStoryTargets(section));
            revealedStoryIndexes.add(index);
          });
          gsap.set(introMenuItems, {
            clearProps: "opacity,transform,visibility",
          });
          if (outroTitle) {
            gsap.set(outroTitle, {
              clearProps: "opacity,transform,filter,visibility",
            });
          }
          if (outroTitleLogo) {
            gsap.set(outroTitleLogo, {
              clearProps: "opacity,transform,visibility",
            });
          }
          if (outroTitlePin) {
            gsap.set(outroTitlePin, { clearProps: "transform" });
          }
          outroRevealed = true;
        } else {
          const visibleMenuItems = window.matchMedia("(min-width: 1025px)").matches
            ? introMenuItems
            : [];

          if (introCompleted || !firstStoryTargets) {
            gsap.set(introBlack, { autoAlpha: 0 });
            if (firstStoryTargets) {
              revealStoryImmediately(firstStoryTargets);
            }
            gsap.set(introMenuItems, {
              clearProps: "opacity,transform,visibility",
            });
          } else {
            setStoryInitialState(firstStoryTargets);
            gsap.set(introBlack, { autoAlpha: 1 });
            gsap.set(introMenuItems, { opacity: 0, y: 12 });

            const introTimeline = gsap.timeline({
              defaults: { ease: "power3.out" },
              onComplete: () => {
                introCompleted = true;
                revealedStoryIndexes.add(0);
                revealStoryImmediately(firstStoryTargets);
                gsap.set(introBlack, { autoAlpha: 0 });
                gsap.set(introMenuItems, {
                  clearProps: "opacity,transform,visibility",
                });
              },
            });

            introTimeline
              .addLabel("titleStart")
              .to(
                firstStoryTargets.titleCharacters,
                {
                  opacity: 1,
                  filter: "blur(0px)",
                  duration: 0.7,
                  stagger: INTRO_CHARACTER_STAGGER,
                  ease: "power2.out",
                },
                "titleStart"
              )
              .addLabel(
                "backgroundReveal",
                `titleStart+=${NUMBER_REVEAL_DELAY}`
              )
              .to(
                introBlack,
                { autoAlpha: 0, duration: 0.9, ease: "power2.out" },
                "backgroundReveal"
              )
              .set(
                firstStoryTargets.rule,
                { opacity: 1 },
                "backgroundReveal+=0.08"
              )
              .to(
                firstStoryTargets.rule,
                { x: 0, duration: 0.65, ease: "power2.inOut" },
                "backgroundReveal+=0.08"
              )
              .to(
                firstStoryTargets.numberCharacters,
                {
                  opacity: 1,
                  y: 0,
                  duration: 0.45,
                  stagger: 0.12,
                },
                ">"
              )
              .addLabel("copyStart", ">+0.12")
              .to(
                firstStoryTargets.label,
                { opacity: 0.65, duration: 0.7, ease: "sine.out" },
                "copyStart"
              )
              .to(
                firstStoryTargets.body,
                { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" },
                "copyStart+=0.25"
              );

            if (visibleMenuItems.length > 0) {
              introTimeline.to(
                visibleMenuItems,
                {
                  opacity: 1,
                  y: 0,
                  duration: 0.45,
                  stagger: INTRO_MENU_STAGGER,
                },
                ">+0.1"
              );
            }
          }

          sections.slice(1).forEach((section, sectionOffset) => {
            const sectionIndex = sectionOffset + 1;
            const targets = getStoryTargets(section);

            if (revealedStoryIndexes.has(sectionIndex)) {
              revealStoryImmediately(targets);
              return;
            }

            setStoryInitialState(targets);
            const revealTimeline = appendStoryReveal(
              gsap.timeline({
                paused: true,
                defaults: { ease: "power3.out" },
                onComplete: () => {
                  revealedStoryIndexes.add(sectionIndex);
                  revealStoryImmediately(targets);
                },
              }),
              targets
            );

            ScrollTrigger.create({
              trigger: section,
              scroller: getScrollTriggerScroller(),
              start: "top 72%",
              once: true,
              onEnter: () => revealTimeline.play(),
            });
          });

          if (outro && outroTitle && outroTitleLogo && outroTitlePin && lastSection) {
            if (outroRevealed) {
              gsap.set(outroTitle, {
                clearProps: "opacity,transform,filter,visibility",
              });
              gsap.set(outroTitleLogo, {
                clearProps: "opacity,transform,visibility",
              });
            } else {
              gsap.set(outroTitle, {
                opacity: 0,
                y: 96,
              });
              gsap.set(outroTitleLogo, {
                opacity: 0,
              });

              const outroTimeline = gsap.timeline({
                paused: true,
                onComplete: () => {
                  outroRevealed = true;
                  gsap.set(outroTitle, {
                    clearProps: "opacity,transform,visibility",
                  });
                  gsap.set(outroTitleLogo, {
                    clearProps: "opacity,transform,visibility",
                  });
                },
              });

              outroTimeline
                .fromTo(
                  outroTitle,
                  {
                    opacity: 0,
                    y: 96,
                  },
                  {
                    opacity: 1,
                    y: 0,
                    duration: 1.4,
                    ease: "power2.out",
                  }
                )
                .fromTo(
                  outroTitleLogo,
                  {
                    opacity: 0,
                  },
                  {
                    opacity: 1,
                    duration: 0.5,
                    ease: "sine.out",
                  },
                  "-=0.2"
                );

              ScrollTrigger.create({
                trigger: lastSection,
                scroller: getScrollTriggerScroller(),
                start: "bottom 40%",
                once: true,
                onEnter: () => outroTimeline.play(),
              });
            }

            if (outroPositionLocked) {
              gsap.set(outroTitlePin, { clearProps: "transform" });
            } else {
              const outroPinTrigger = ScrollTrigger.create({
                trigger: lastSection,
                scroller: getScrollTriggerScroller(),
                start: "bottom 40%",
                endTrigger: outro,
                end: "center center",
                invalidateOnRefresh: true,
                onEnter: keepOutroTitleAtViewportCenter,
                onUpdate: keepOutroTitleAtViewportCenter,
                onLeave: () => {
                  lockOutroTitlePosition();
                  outroPinTrigger.kill();
                },
              });
            }
          }
        }

        const setActiveBackground = (activeIndex: number) => {
          for (const [index, background] of backgrounds.entries()) {
            gsap.set(background, {
              opacity: index === activeIndex ? 1 : 0,
              scale: 1,
              xPercent: 0,
              yPercent: 0,
            });
          }
        };

        if (reducedMotion.matches) {
          sections.forEach((section, index) => {
            ScrollTrigger.create({
              trigger: section,
              scroller: getScrollTriggerScroller(),
              start: "top center",
              end: "bottom center",
              onEnter: () => setActiveBackground(index),
              onEnterBack: () => setActiveBackground(index),
              onToggle: ({ isActive }) => {
                if (isActive) {
                  setActiveBackground(index);
                }
              },
            });
          });
          return;
        }

        backgrounds.forEach((background, index) => {
          const section = sections[index];
          if (!section) {
            return;
          }

          const transitionStart = index === 0 ? "top top" : "top 45%";
          const isLastBackground = index === backgrounds.length - 1;
          const transitionEnd = isLastBackground
            ? "bottom bottom"
            : "bottom 45%";

          gsap
            .timeline({
              scrollTrigger: {
                trigger: section,
                scroller: getScrollTriggerScroller(),
                start: transitionStart,
                end: transitionEnd,
                scrub: true,
                invalidateOnRefresh: true,
              },
            })
            .fromTo(
              background,
              { scale: BACKGROUND_CLOSEUP_SCALE },
              {
                scale: BACKGROUND_WIDE_SCALE,
                duration: 1,
                ease: "none",
                force3D: true,
              }
            );

          const brightness = gsap.timeline({
            scrollTrigger: {
              trigger: section,
              scroller: getScrollTriggerScroller(),
              start: transitionStart,
              end: transitionEnd,
              scrub: true,
              invalidateOnRefresh: true,
            },
          });

          if (index > 0) {
            brightness.to(background, {
              opacity: 1,
              duration: 0.18,
              ease: "none",
            });
          } else {
            brightness.set(background, { opacity: 1 });
          }

          brightness
            .to(background, { opacity: 1, duration: index > 0 ? 0.64 : 0.82 })
            .to(background, { opacity: 0, duration: 0.18, ease: "none" });
        });

        foregrounds.forEach((foreground, index) => {
          const section = sections[index];
          if (!section) {
            return;
          }

          gsap.to(foreground, {
            y: () => -getParallaxDistance(),
            opacity: 0,
            ease: "none",
            force3D: true,
            scrollTrigger: {
              trigger: section,
              scroller: getScrollTriggerScroller(),
              start: "bottom 45%",
              end: "bottom 10%",
              scrub: true,
              invalidateOnRefresh: true,
            },
          });
        });
      }, region);

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
    <div ref={regionRef} className={className}>
      {children}
    </div>
  );
}
