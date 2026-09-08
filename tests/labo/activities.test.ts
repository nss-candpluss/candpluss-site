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
    expect(laboActivitiesContent.title).toBe("LABOでできること");
    expect(laboActivitiesContent.label).toBe("WHAT YOU CAN DO");
    expect(laboActivitiesContent.items.map((item) => item.title)).toEqual([
      "MOYAを実寸サイズで",
      "細部まで手に取って確かめる",
      "確かめてその場で選ぶ",
    ]);
    expect(laboActivitiesContent.items).toHaveLength(3);
  });

  it("follows the Home News three-column card layout", () => {
    expect(laboActivitiesSource).toContain("sectionTitle62ClassName");
    expect(laboActivitiesSource).toContain("standardCardSpanClassName");
    expect(laboActivitiesSource).toContain("SiteGrid");
    expect(laboActivitiesSource).toContain("aspect-[13/10]");
    expect(laboActivitiesSource).toContain(
      "mt-[calc(98px*var(--layout-scale-y))]"
    );
    expect(laboActivitiesSource).toContain("gap-x-[calc(16px*var(--gap-scale-x))]");
    expect(laboActivitiesSource).toContain("uiText(16)");
    expect(laboActivitiesSource).toContain("bodyText(15)");
    expect(laboActivitiesSource).not.toContain("<Link");
  });
});
