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
    expect(laboAccessContent.title).toBe("LABOへのアクセス");
    expect(laboAccessContent.label).toBe("ACCESS");
    expect(laboAccessContent.body).toContain("C AND+S LABO");
    expect(laboAccessContent.body).toContain("〒816-0902");
    expect(laboAccessContent.body).toContain("福岡県大野城市乙金1-10-40-1F");
    expect(laboAccessContent.body).toContain("営業時間：10:00 - 17:00");
    expect(laboAccessContent.body).toContain("定休日：土日、祝日");
    expect(laboAccessContent.body).toContain("駐車場：あり");
    expect(laboAccessContent.map.src).toContain("maps.google.com/maps");
    expect(laboAccessContent.map.src).toContain("output=embed");
  });

  it("places the map in the about two-column layout", () => {
    expect(laboAccessSource).toContain("min-[1025px]:grid-cols-2");
    expect(laboAccessSource).toContain("aspect-[13/10]");
    expect(laboAccessSource).toContain("min-[1025px]:row-span-2");
    expect(laboAccessSource).toContain("<iframe");
    expect(laboAccessSource).toContain("grayscale");
    expect(laboAccessSource).not.toContain("brightness-");
    expect(laboAccessSource).not.toContain("mix-blend-multiply");
    expect(laboAccessSource).toContain("sectionTitle62ClassName");
    expect(laboAccessSource).toContain("uiText(18)");
    expect(laboAccessSource).toContain("bodyText(16)");
    expect(laboAccessSource).toContain("whitespace-pre-line");
  });
});
