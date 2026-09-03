import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

const conceptPageSource = readFileSync(
  join(root, "sections/concept/ConceptPage.tsx"),
  "utf8"
);

const parallaxSource = readFileSync(
  join(root, "sections/concept/ConceptParallaxRegion.tsx"),
  "utf8"
);

describe("Concept content parallax", () => {
  it("renders a sticky background stage behind 140svh desktop sections", () => {
    expect(conceptPageSource).toContain("ConceptParallaxRegion");
    expect(conceptPageSource).toContain("data-concept-background-stage");
    expect(conceptPageSource).toContain("data-concept-background={section.id}");
    expect(conceptPageSource).toContain("sticky top-0 h-svh overflow-hidden");
    expect(conceptPageSource).toContain("-mt-[100svh]");
    expect(conceptPageSource).toContain("min-[1024px]:min-h-[140svh]");
    expect(conceptPageSource).toContain("flex h-[50svh] w-full items-end");
    expect(conceptPageSource).toContain("data-concept-section");
    expect(conceptPageSource).toContain("data-concept-parallax");
  });

  it("zooms every background out from close-up to its widest cover framing", () => {
    expect(parallaxSource).toContain('"use client"');
    expect(parallaxSource).toContain("subscribeMotionReady");
    expect(parallaxSource).toContain("scroller: getScrollTriggerScroller()");
    expect(parallaxSource).toContain("BACKGROUND_CLOSEUP_SCALE = 1.16");
    expect(parallaxSource).toContain("BACKGROUND_WIDE_SCALE = 1");
    expect(parallaxSource).toContain("backgrounds.forEach");
    expect(parallaxSource).toContain("{ scale: BACKGROUND_CLOSEUP_SCALE }");
    expect(parallaxSource).toContain("scale: BACKGROUND_WIDE_SCALE");
    expect(parallaxSource).toContain(
      "scale: BACKGROUND_WIDE_SCALE,\n                duration: 1"
    );
    expect(conceptPageSource).toContain("object-cover object-center");
    expect(conceptPageSource).not.toContain("object-contain");
    expect(parallaxSource).toContain("scrub: true");
  });

  it("repeats full-black, brighten, and darken transitions between images", () => {
    expect(parallaxSource).toContain(
      'const transitionStart = index === 0 ? "top top" : "top 45%"'
    );
    expect(parallaxSource).toContain(
      "const isLastBackground = index === backgrounds.length - 1"
    );
    expect(parallaxSource).toContain(
      'isLastBackground\n            ? "bottom bottom"\n            : "bottom 45%"'
    );
    expect(parallaxSource).toContain("const brightness = gsap.timeline");
    expect(parallaxSource).toContain("opacity: 1,\n              duration: 0.18");
    expect(parallaxSource).toContain(
      "duration: index > 0 ? 0.64 : 0.82"
    );
    expect(parallaxSource).toContain(
      ".to(background, { opacity: 0, duration: 0.18"
    );
    expect(parallaxSource).not.toContain("previousBackground");
  });

  it("fades and offsets foreground copy with the background zoom", () => {
    expect(parallaxSource).not.toContain('"(pointer: fine) and (min-width: 1024px)"');
    expect(parallaxSource).toContain('end: "bottom 10%"');
    expect(parallaxSource).toContain("getParallaxDistance");
    expect(parallaxSource).toContain("opacity: 0");
    expect(parallaxSource).toContain("opacity: 1");
  });

  it("plays the first-view intro in the requested order on every mount", () => {
    const titleStep = parallaxSource.indexOf(
      "firstStoryTargets.titleCharacters"
    );
    const backgroundStep = parallaxSource.indexOf('"backgroundReveal"');
    const numberStep = parallaxSource.indexOf(
      "firstStoryTargets.numberCharacters"
    );
    const bodyStep = parallaxSource.indexOf("firstStoryTargets.body");
    const menuStep = parallaxSource.indexOf(
      "introTimeline.to(\n                visibleMenuItems"
    );

    expect(titleStep).toBeGreaterThan(-1);
    expect(backgroundStep).toBeGreaterThan(titleStep);
    expect(numberStep).toBeGreaterThan(backgroundStep);
    expect(bodyStep).toBeGreaterThan(numberStep);
    expect(menuStep).toBeGreaterThan(bodyStep);
    expect(parallaxSource).toContain("NUMBER_REVEAL_DELAY = 0.3");
    expect(parallaxSource).toContain('addLabel("titleStart")');
    expect(parallaxSource).toContain(
      '`titleStart+=${NUMBER_REVEAL_DELAY}`'
    );
    expect(parallaxSource).toContain('">"');
    expect(parallaxSource).toContain("setStoryInitialState");
    expect(parallaxSource).toContain("{ x: 0, duration: 0.65");
    expect(parallaxSource).toContain("let introCompleted = false");
    expect(parallaxSource).not.toContain("sessionStorage");
  });

  it("softly reveals title characters from left to right without vertical motion", () => {
    expect(parallaxSource).toContain("INTRO_CHARACTER_STAGGER = 0.06");
    expect(parallaxSource).toContain('filter: "blur(4px)"');
    expect(parallaxSource).toContain('filter: "blur(0px)"');
    expect(parallaxSource).toContain("duration: 0.7");
    expect(parallaxSource).not.toContain(
      'gsap.set(targets.titleCharacters, { opacity: 0, y: "0.6em" })'
    );
  });

  it("fades menu wrappers to full opacity without doubling inactive link opacity", () => {
    expect(parallaxSource).toContain(
      "visibleMenuItems,\n                {\n                  opacity: 1"
    );
    expect(parallaxSource).not.toContain(
      "element.querySelector('[aria-current=\"location\"]')"
    );
  });

  it("reveals sections 02-09 once and keeps them visible when scrolling back", () => {
    expect(parallaxSource).toContain("sections.slice(1).forEach");
    expect(parallaxSource).toContain("appendStoryReveal");
    expect(parallaxSource).toContain("revealedStoryIndexes");
    expect(parallaxSource).toContain('start: "top 72%"');
    expect(parallaxSource).toContain("once: true");
    expect(parallaxSource).toContain("onEnter: () => revealTimeline.play()");
  });

  it("fully darkens 09 before revealing the final title once on black", () => {
    expect(parallaxSource).toContain("backgrounds.forEach");
    expect(parallaxSource).toContain(
      ".to(background, { opacity: 0, duration: 0.18"
    );
    expect(parallaxSource).toContain('"[data-concept-outro]"');
    expect(parallaxSource).toContain(
      '"[data-concept-outro-title]"'
    );
    expect(parallaxSource).toContain(
      '"[data-concept-outro-title-pin]"'
    );
    expect(parallaxSource).not.toContain(
      '"[data-concept-outro-title-character]"'
    );
    expect(parallaxSource).toContain("keepOutroTitleAtViewportCenter");
    expect(parallaxSource).toContain("lockOutroTitlePosition");
    expect(parallaxSource).toContain("outroPositionLocked");
    expect(parallaxSource).toContain("outroPinTrigger.kill()");
    expect(parallaxSource).toContain("trigger: lastSection");
    expect(parallaxSource).toContain('start: "bottom 40%"');
    expect(parallaxSource).not.toContain('start: "bottom 20%"');
    expect(parallaxSource).toContain("endTrigger: outro");
    expect(parallaxSource).toContain('end: "center center"');
    expect(parallaxSource).not.toContain('start: "center 72%"');
    expect(parallaxSource).not.toContain(
      "onEnterBack: keepOutroTitleAtViewportCenter"
    );
    expect(parallaxSource).not.toContain('filter: "blur(8px)"');
    expect(parallaxSource).toContain("y: 96");
    expect(parallaxSource).toContain(
      "{\n                  opacity: 1,\n                  y: 0,\n                  duration: 1.4,\n                  ease: \"power2.out\",\n                }"
    );
    expect(parallaxSource).toContain("once: true");
    expect(parallaxSource).toContain("outroTimeline.play()");
    expect(parallaxSource).not.toContain("outroTimeline.pause(0)");
    expect(parallaxSource).toContain("outroRevealed");
  });

  it("keeps every foreground stable until its exit phase", () => {
    expect(parallaxSource).not.toContain('start: "top 90%"');
    expect(parallaxSource).toContain('start: "bottom 45%"');
    expect(parallaxSource).toContain('end: "bottom 10%"');
  });

  it("uses instant background switching only for reduced motion", () => {
    expect(parallaxSource).toContain('"(prefers-reduced-motion: reduce)"');
    expect(parallaxSource).toContain("reducedMotion.matches");
    expect(parallaxSource).not.toContain("!desktopMotion.matches");
    expect(parallaxSource).toContain("setActiveBackground");
    expect(parallaxSource).toContain('clearProps: "transform,opacity"');
    expect(parallaxSource).toContain("revealStoryImmediately");
    expect(parallaxSource).toContain("if (reducedMotion.matches)");
    expect(parallaxSource).toContain('window.matchMedia("(min-width: 1024px)")');
  });
});
