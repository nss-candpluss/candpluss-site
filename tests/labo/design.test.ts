import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { laboDesignContent } from "@/data/labo";

const laboDesignSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../../sections/labo/LaboDesign.tsx"),
  "utf8"
);

describe("labo design section", () => {
  it("uses the design and development copy", () => {
    expect(laboDesignContent.title).toBe("LABOではデザイン・開発を行っています");
    expect(laboDesignContent.label).toBe("DESIGN & DEVELOPMENT");
    expect(laboDesignContent.body).toContain("製品を生み出す拠点でもあります");
  });

  it("matches the about two-column layout on a dark background", () => {
    expect(laboDesignSource).toContain('data-header-theme="onDark"');
    expect(laboDesignSource).toContain("bg-black");
    expect(laboDesignSource).toContain("min-[1025px]:grid-cols-2");
    expect(laboDesignSource).toContain("aspect-[13/10]");
    expect(laboDesignSource).toContain("min-[1025px]:row-span-2");
    expect(laboDesignSource).toContain("sectionTitle62ClassName");
    expect(laboDesignSource).toContain("uiText(18)");
    expect(laboDesignSource).toContain("bodyText(16)");
  });
});
