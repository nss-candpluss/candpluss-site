import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { footerContent } from "@/data/footer";
import { licensesContent } from "@/data/legal/licenses";
import { supportContactPageContent } from "@/data/support-contact";
import { sitemapStaticPaths } from "@/lib/sitemap";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../..");

function section(title: string) {
  return licensesContent.sections.find((item) => item.title === title);
}

/**
 * heic-to は runtime 依存としてブラウザへ配信される LGPL-3.0+ ソフトウェア。
 * 告知への到達手段がないと義務を満たせないため、導線ごと検証する。
 */
describe("ライセンス表記", () => {
  it("唯一の利用箇所である初期不良・修理フォームから到達できる", () => {
    expect(supportContactPageContent.licenseNote.href).toBe("/legal/licenses");
    expect(supportContactPageContent.licenseNote.linkLabel).toBe("ライセンス表記");
    expect(supportContactPageContent.licenseNote.before).toContain(
      "画像の変換、圧縮するためにオープンソースソフトウェア"
    );
  });

  it("注釈はフォームの枠外（フォームより後ろ）に置く", () => {
    const source = readFileSync(
      join(rootDir, "sections/support/SupportGuide.tsx"),
      "utf8"
    );

    expect(source.indexOf("<SupportContactForm />")).toBeLessThan(
      source.indexOf("licenseNote.before")
    );
  });

  it("Footer には載せない（利用しているページにだけ置く方針）", () => {
    const footerLegalHrefs: readonly string[] = footerContent.legalLinks.map(
      (link) => link.href
    );

    expect(footerLegalHrefs).not.toContain("/legal/licenses");
  });

  it("sitemap に含まれる", () => {
    expect(sitemapStaticPaths).toContain("/legal/licenses");
  });

  it("LGPL の heic-to について、ライセンス名・入手元・改変の有無を明示している", () => {
    const texts = section("heic-to 1.5.2")?.clauses?.map((clause) => clause.text).join("\n") ?? "";

    expect(texts).toContain("LGPL-3.0+");
    expect(texts).toContain("https://github.com/hoppergee/heic-to");
    expect(texts).toContain("https://www.gnu.org/licenses/lgpl-3.0.txt");
    expect(texts).toContain("改変を加えていません");
  });

  it("MIT の browser-image-compression について、著作権表示と許諾文を全文掲載している", () => {
    const texts =
      section("browser-image-compression 2.0.2")?.clauses?.map((clause) => clause.text).join("\n") ??
      "";

    expect(texts).toContain("Copyright (c) 2019 Donald Chan");
    expect(texts).toContain("Permission is hereby granted");
    expect(texts).toContain("WITHOUT WARRANTY OF ANY KIND");
  });
});
