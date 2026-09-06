import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { companyContent } from "@/data/company";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

function source(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

describe("company document", () => {
  it("keeps ABOUT US and company information only", () => {
    expect(companyContent.title).toBe("ABOUT US");
    expect(companyContent.items.map((item) => item.label)).toEqual([
      "会社名",
      "本社所在地",
      "TEL",
      "FAX",
      "代表者",
      "設立",
      "資本金",
      "決算期",
      "事業内容",
      "取引銀行",
    ]);
  });

  it("aligns the page title with the company information table on a white background", () => {
    const documentSource = source("components/company/CompanyDocument.tsx");
    const pageSource = source("app/company/page.tsx");

    expect(documentSource).toContain('className="mx-auto w-full max-w-[980px]"');
    expect(documentSource).toContain("sectionTitle62ClassName");
    expect(documentSource).toContain("CompanyInfoTable items={items}");
    expect(documentSource).not.toContain("labTitle");
    expect(documentSource).not.toContain("labItems");
    expect(documentSource).not.toContain("homeLabContent");
    expect(documentSource).not.toContain("bg-[#f5f5f5]");
    expect(documentSource).not.toContain("Fukuoka Lab");
    expect(pageSource).toContain("bg-[var(--background)]");
  });

  it("renders trading banks with a nakaguro prefix instead of disc bullets", () => {
    const documentSource = source("components/company/CompanyDocument.tsx");
    const banks = companyContent.items.find((item) => item.label === "取引銀行");

    expect(banks?.blocks[0]).toEqual({
      type: "bullets",
      items: [
        "株式会社三菱UFJ銀行",
        "株式会社福岡銀行",
        "株式会社筑邦銀行",
        "株式会社西日本シティ銀行",
      ],
    });
    expect(documentSource).toContain("list-none");
    expect(documentSource).toContain("・{item}");
    expect(documentSource).not.toContain("list-disc");
  });
});
