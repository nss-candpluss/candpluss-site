import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { commercialTransactionsContent } from "@/data/legal/commercialTransactions";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

function item(label: string) {
  return commercialTransactionsContent.items.find((entry) => entry.label === label);
}

describe("commercial transactions document", () => {
  it("keeps the stacked legal-document layout instead of a definition list", () => {
    const documentSource = readFileSync(
      join(root, "components/legal/CommercialTransactionsDocument.tsx"),
      "utf8"
    );

    expect(documentSource).toContain('className="mx-auto w-full max-w-[980px]"');
    expect(documentSource).toContain("space-y-[calc(52px*var(--gap-scale-y))]");
    expect(documentSource).toContain("pageTitleClassName");
    expect(documentSource).toContain("sectionHeadingClassName");
    expect(documentSource).not.toContain("<dl");
    expect(documentSource).not.toContain("definitionLabelSpanClassName");
  });

  it("fills in shipping, payment, delivery, and return windows", () => {
    expect(item("商品代金以外に必要な料金")?.blocks).toEqual([
      {
        type: "bullets",
        items: [
          "送料：全国一律700円（税込価格5,000円以上で送料無料）",
          "各種決済手数料（代引き手数料、後払い手数料など）",
        ],
      },
    ]);
    expect(item("支払方法")?.blocks[0]).toEqual({
      type: "paragraph",
      text: "クレジットカード決済、Google Pay、Apple Pay、銀行振込",
    });
    expect(item("商品の引渡時期")?.blocks[0]).toEqual({
      type: "paragraph",
      text: "決済承認（またはご入金確認）後、通常3営業日以内に発送いたします。ただし、予約商品等の場合は商品ページに記載の納期に基づきます。",
    });

    const returns = item("返品・交換・キャンセルについて")?.blocks ?? [];

    expect(returns).toHaveLength(5);
    expect(returns.every((block) => block.type === "paragraph")).toBe(true);
    expect(returns[0]).toMatchObject({
      type: "paragraph",
      text: expect.stringContaining("商品到着後8日以内にご連絡ください"),
    });
    expect(returns[2]).toMatchObject({
      type: "paragraph",
      text: expect.stringContaining("・商品到着後9日以上経過した場合"),
    });
    expect(returns.every((block) => block.type !== "paragraph" || !block.text.includes("\n\n"))).toBe(
      true
    );
  });

  it("spaces return policy blocks with the same 16px margin as other legal pages", () => {
    const documentSource = readFileSync(
      join(root, "components/legal/CommercialTransactionsDocument.tsx"),
      "utf8"
    );

    expect(documentSource).toContain("whitespace-pre-line");
    expect(documentSource).toContain("space-y-[calc(16px*var(--gap-scale-y))]");
    expect(item("返品・交換・キャンセルについて")?.blocks).toHaveLength(5);
  });

  it("lists shop contact emails on separate lines with the official shop address", () => {
    expect(item("メールアドレス")?.blocks).toEqual([
      { type: "paragraph", text: "info@cpcam.jp（代表）" },
      { type: "paragraph", text: "info@candpluss.camp（ショップ窓口）" },
    ]);
  });
});
