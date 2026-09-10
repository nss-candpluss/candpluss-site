import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { laboAccessContent } from "@/data/labo";

const laboAccessSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../../sections/labo/LaboAccess.tsx"),
  "utf8"
);

describe("labo access section", () => {
  it("uses the access copy and map embed", () => {
    expect(laboAccessContent.number).toBe("05.");
    expect(laboAccessContent.title).toBe("LABOへのアクセス");
    expect(laboAccessContent.titleWrapSegments).toEqual([
      "LABOへの",
      "アクセス",
    ]);
    expect(laboAccessContent.label).toBe("ACCESS");
    expect(laboAccessContent.address).toEqual({
      postal: "〒816-0902",
      street: "福岡県大野城市乙金1-10-40-1F",
    });
    expect(laboAccessContent.details).toEqual([
      { label: "営業時間", value: "10:00 - 17:00" },
      { label: "定休日", value: "土日、祝日、年末年始" },
      { label: "駐車場", value: "あり" },
    ]);
    expect(laboAccessContent.map.src).toContain("maps.google.com/maps");
    expect(laboAccessContent.map.src).toContain("output=embed");
  });

  it("places the map in the about two-column layout", () => {
    expect(laboAccessSource).toContain(
      "pb-[clamp(82px,calc(82px+(100vw-390px)/(1920px-390px)*102px),184px)]"
    );
    expect(laboAccessSource).not.toContain("pb-[var(--container-y-bottom)]");
    expect(laboAccessSource).toContain("min-[1025px]:grid-cols-2");
    expect(laboAccessSource).toContain("aspect-[13/10]");
    expect(laboAccessSource).toContain("min-[1025px]:absolute");
    expect(laboAccessSource).toContain("min-[1025px]:inset-y-0");
    expect(laboAccessSource).toContain("min-[1025px]:right-0");
    expect(laboAccessSource).toContain(
      "min-[1025px]:w-[calc(50%-calc(52px*var(--gap-scale-x))/2)]"
    );
    expect(laboAccessSource).toContain("min-[1025px]:row-span-2");
    expect(laboAccessSource).toContain("<iframe");
    expect(laboAccessSource).toContain("grayscale");
    expect(laboAccessSource).not.toContain("brightness-");
    expect(laboAccessSource).not.toContain("mix-blend-multiply");
    expect(laboAccessSource).toContain("titleWrapSegments");
    expect(laboAccessSource).toContain("gap-y-[0.2em]");
    expect(laboAccessSource).toContain("whitespace-nowrap");
    expect(laboAccessSource).toContain("uiText(48)");
    expect(laboAccessSource).toContain("concept-heading-numeral");
    expect(laboAccessSource).toContain(
      "mb-[clamp(16px,calc(20px*var(--gap-scale-y)),20px)]"
    );
    expect(laboAccessSource).toContain("uiText(18)");
    expect(laboAccessSource).toContain(
      "mt-[clamp(10px,calc(16px*var(--gap-scale-y)),16px)]"
    );
    expect(laboAccessSource).toContain("bodyText(16)");
    expect(laboAccessSource).toContain(
      "mt-[clamp(38px,calc(72px*var(--gap-scale-y)),72px)]"
    );
    expect(laboAccessSource).toContain("mt-[1.2em]");
    expect(laboAccessSource).toContain("mb-[0.5em]");
    expect(laboAccessSource).toContain("address.postal");
    expect(laboAccessSource).toContain("address.street");
    expect(laboAccessSource).toContain("whitespace-nowrap");
    expect(laboAccessSource).toContain("font-semibold");
    expect(laboAccessSource).toContain("text-[var(--color-muted)]");
    expect(laboAccessSource).toContain("laboContent.hero.titleLogo");
    expect(laboAccessSource).toContain("laboContent.hero.title");
    expect(laboAccessSource).toContain("1.2em*814.088/72.001");
    expect(laboAccessSource).not.toContain("brightness-0 invert");
    expect(laboAccessSource).not.toContain("sectionTitle62ClassName");
    expect(laboAccessSource).not.toContain(
      "mt-[calc(32px*var(--gap-scale-y))]"
    );
    expect(laboAccessSource).not.toContain(
      "mt-[calc(42px*var(--gap-scale-y))]"
    );
  });
});
