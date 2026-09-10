import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { laboActivitiesContent } from "@/data/labo";

const laboActivitiesSource = readFileSync(
  join(
    dirname(fileURLToPath(import.meta.url)),
    "../../sections/labo/LaboActivities.tsx"
  ),
  "utf8"
);

describe("labo activities section", () => {
  it("uses the three activity cards and copy", () => {
    expect(laboActivitiesContent.number).toBe("02.");
    expect(laboActivitiesContent.title).toBe("LABOでできること");
    expect(laboActivitiesContent.titleWrapSegments).toEqual([
      "LABOで",
      "できること",
    ]);
    expect(laboActivitiesContent.label).toBe("WHAT YOU CAN DO");
    expect(laboActivitiesContent.items.map((item) => item.title)).toEqual([
      "MOYAを実寸サイズで",
      "細部まで手に取って確かめる",
      "確かめてその場で選ぶ",
    ]);
    expect(laboActivitiesContent.items).toHaveLength(3);
  });

  it("follows the Home News three-column card layout", () => {
    expect(laboActivitiesSource).toContain("titleWrapSegments");
    expect(laboActivitiesSource).toContain("gap-y-[0.2em]");
    expect(laboActivitiesSource).toContain("whitespace-nowrap");
    expect(laboActivitiesSource).toContain("uiText(48)");
    expect(laboActivitiesSource).toContain("concept-heading-numeral");
    expect(laboActivitiesSource).toContain(
      "mb-[clamp(16px,calc(20px*var(--gap-scale-y)),20px)]"
    );
    expect(laboActivitiesSource).toContain(
      "mt-[clamp(10px,calc(16px*var(--gap-scale-y)),16px)]"
    );
    expect(laboActivitiesSource).toContain(
      "mt-[clamp(38px,calc(102px*var(--gap-scale-y)),102px)]"
    );
    expect(laboActivitiesSource).toContain(
      "min-[1025px]:mt-[clamp(38px,calc(148px*var(--gap-scale-y)),148px)]"
    );
    expect(laboActivitiesSource).toContain(
      "mt-[clamp(18px,calc(32px*var(--gap-scale-y)),32px)]"
    );
    expect(laboActivitiesSource).toContain("featuredItem.title");
    expect(laboActivitiesSource).toContain("featuredItem.body");
    expect(laboActivitiesSource).toContain("featuredItem.image");
    expect(laboActivitiesSource).toContain("secondItem.image");
    expect(laboActivitiesSource).toContain("secondItem.title");
    expect(laboActivitiesSource).toContain("secondItem.body");
    expect(laboActivitiesSource).toContain("thirdItem.title");
    expect(laboActivitiesSource).toContain("thirdItem.body");
    expect(laboActivitiesSource).toContain("thirdItem.image");
    expect(laboActivitiesSource).toContain("contents");
    expect(laboActivitiesSource).toContain("order-1");
    expect(laboActivitiesSource).toContain("order-2");
    expect(laboActivitiesSource).toContain("order-3");
    expect(laboActivitiesSource).toContain("order-4");
    expect(laboActivitiesSource).toContain("order-5");
    expect(laboActivitiesSource).toContain("order-6");
    expect(laboActivitiesSource).toContain("order-7");
    expect(laboActivitiesSource).toContain("min-[1025px]:grid-cols-2");
    expect(laboActivitiesSource).toContain(
      "[--labo-activities-inset:clamp(38px,calc(102px*var(--gap-scale-y)),102px)]"
    );
    expect(laboActivitiesSource).toContain(
      "min-[1025px]:gap-x-[var(--labo-activities-inset)]"
    );
    expect(laboActivitiesSource).toContain(
      "min-[1025px]:pl-[calc(var(--labo-activities-inset)-var(--container-x))]"
    );
    expect(laboActivitiesSource).toContain(
      "min-[1025px]:pr-[calc(var(--labo-activities-inset)-var(--container-x))]"
    );
    expect(laboActivitiesSource).toContain(
      "min-[1025px]:-ml-[calc(var(--labo-activities-inset)-var(--container-x))]"
    );
    expect(laboActivitiesSource).not.toContain(
      "min-[1025px]:gap-x-[calc(52px*var(--gap-scale-x))]"
    );
    expect(laboActivitiesSource).toContain("aspect-[13/10]");
    expect(laboActivitiesSource).toContain(
      "mt-[calc(98px*var(--layout-scale-y))]"
    );
    expect(laboActivitiesSource).not.toContain(
      "gap-y-[calc(62px*var(--gap-scale-y))]"
    );
    expect(laboActivitiesSource).not.toContain(
      "min-[1025px]:gap-y-[calc(16px*var(--gap-scale-y))]"
    );
    expect(laboActivitiesSource).toContain("uiText(21)");
    expect(laboActivitiesSource).toContain("bodyText(16)");
    expect(laboActivitiesSource).not.toContain(
      "mt-[calc(22px*var(--gap-scale-y))]"
    );
    expect(laboActivitiesSource).not.toContain(
      "mt-[calc(15px*var(--gap-scale-y))]"
    );
    expect(laboActivitiesSource).not.toContain(
      "px-[calc(8px*var(--gap-scale-x))]"
    );
    expect(laboActivitiesSource).not.toContain("<Link");
    expect(laboActivitiesSource).toContain("bg-[var(--background)]");
    expect(laboActivitiesSource).toContain("pb-[var(--container-y-bottom)]");
    expect(laboActivitiesSource).not.toContain("pt-[var(--container-y-top)]");
    expect(laboActivitiesSource).not.toContain("bg-[#f5f5f5]");
  });

  it("moves the desktop columns in opposite directions on scroll", () => {
    expect(laboActivitiesSource).toContain('"use client"');
    expect(laboActivitiesSource).toContain(
      'DESKTOP_QUERY = "(min-width: 1025px)"'
    );
    expect(laboActivitiesSource).toContain("LEFT_END_Y_PERCENT = 5");
    expect(laboActivitiesSource).toContain("RIGHT_START_Y_PERCENT = 10");
    expect(laboActivitiesSource).toContain("data-labo-activities-left");
    expect(laboActivitiesSource).toContain("data-labo-activities-right");
    expect(laboActivitiesSource).toContain("subscribeMotionReady");
    expect(laboActivitiesSource).toContain("getScrollTriggerScroller");
    expect(laboActivitiesSource).toContain("!desktop.matches");
    expect(laboActivitiesSource).toContain("reducedMotion.matches");
    expect(laboActivitiesSource).toContain("yPercent: LEFT_END_Y_PERCENT");
    expect(laboActivitiesSource).toContain(
      "{ yPercent: RIGHT_START_Y_PERCENT }"
    );
    expect(laboActivitiesSource).not.toContain("scale:");
    expect(laboActivitiesSource).not.toContain("transformOrigin:");
    expect(laboActivitiesSource).toContain('start: "top bottom"');
    expect(laboActivitiesSource).toContain('end: "bottom top"');
    expect(laboActivitiesSource).toContain("scrub: true");
  });
});
