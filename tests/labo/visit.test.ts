import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { footerContent } from "@/data/footer";
import { laboVisitContent } from "@/data/labo";

const laboVisitSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../../sections/labo/LaboVisit.tsx"),
  "utf8"
);

describe("labo visit reservation", () => {
  it("uses the visit copy, notes, and reservation button labels", () => {
    expect(laboVisitContent.title).toBe("LABO見学予約");
    expect(laboVisitContent.label).toBe("VISIT THE LABO");
    expect(laboVisitContent.body).toContain("見学は事前予約制です");
    expect(laboVisitContent.notes).toHaveLength(3);
    expect(laboVisitContent.notes[0]).toContain("完全予約制です");
    expect(laboVisitContent.lineButton.label).toBe("LINEでご予約");
    expect(laboVisitContent.contactButton.label).toBe(
      "お問い合わせフォームよりご予約"
    );
    expect(laboVisitContent.contactButton.href).toBe("/contact");
  });

  it("uses Support-style LINE and form buttons", () => {
    const line = footerContent.socialLinks.find((link) => link.label === "LINE");

    expect(laboVisitSource).toContain("twoColumnFeatureSpanClassName");
    expect(laboVisitSource).toContain("lineButton.label");
    expect(laboVisitSource).toContain("contactButton.label");
    expect(laboVisitSource).toContain("lineLink.icon");
    expect(laboVisitSource).toContain("arrowMaskStyle");
    expect(laboVisitSource).toContain("px-[calc(32px*var(--gap-scale-x))]");
    expect(laboVisitSource).toContain("py-[calc(32px*var(--layout-scale-y))]");
    expect(laboVisitSource).toContain("min-[1025px]:py-[calc(18px*var(--gap-scale-y))]");
    expect(line?.icon).toBe("/assets/icons/icon-sns-line.svg");
  });
});
