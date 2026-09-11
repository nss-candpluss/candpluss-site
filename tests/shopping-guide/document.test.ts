import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { shoppingGuideContent } from "@/data/shoppingGuide";
import { commercialTransactionsContent } from "@/data/legal/commercialTransactions";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

function item(label: string) {
  return commercialTransactionsContent.items.find((entry) => entry.label === label);
}

function section(title: string) {
  return shoppingGuideContent.sections.find((entry) => entry.title === title);
}

describe("shopping guide document", () => {
  it("uses the legal-document title, section, and margin spacing", () => {
    const documentSource = readFileSync(
      join(root, "components/shopping-guide/ShoppingGuideDocument.tsx"),
      "utf8"
    );

    expect(documentSource).toContain("pageTitleClassName");
    expect(documentSource).toContain("sectionHeadingClassName");
    expect(documentSource).toContain("uiText(18)");
    expect(documentSource).toContain("space-y-[calc(52px*var(--gap-scale-y))]");
    expect(documentSource).toContain("space-y-[calc(16px*var(--gap-scale-y))]");
    expect(documentSource).not.toContain("gap-[calc(32px*var(--gap-scale-y))]");
    expect(documentSource).not.toContain("font-heading");
  });

  it("aligns shipping, delivery, payment, and returns with the legal notice", () => {
    const shipping = JSON.stringify(section("送料・配送について"));
    const payment = JSON.stringify(section("お支払いについて"));
    const returns = section("返品・交換・キャンセルについて")?.subsections[0]?.blocks ?? [];
    const legalReturns = item("返品・交換・キャンセルについて")?.blocks ?? [];

    expect(shipping).toContain("全国一律700円（税込価格5,000円以上で送料無料）");
    expect(shipping).toContain("通常3営業日以内に発送");
    expect(shipping).not.toContain("990円");
    expect(payment).toContain("クレジットカード決済、Google Pay、Apple Pay、銀行振込");
    expect(payment).toContain("■Shop Pay");
    expect(payment).toContain("ネットショップシステムShopifyが提供する決済サービスです");
    expect(payment).toContain("6桁のショップペイコード（SMS認証）");
    expect(payment).toContain("Shop Pay ログインページは こちら>>");
    expect(payment).toContain("Shop Pay アカウント削除ページは こちら>>");
    expect(returns).toEqual(legalReturns);
  });

  it("does not include a contact section or product inquiry links", () => {
    expect(shoppingGuideContent.sections.map((entry) => entry.title)).not.toContain(
      "お問い合わせについて"
    );
    expect(JSON.stringify(shoppingGuideContent)).not.toContain("製品に関するご質問はこちら");
    expect(JSON.stringify(shoppingGuideContent)).not.toContain(
      "初期不良に関するお問い合わせはこちら"
    );
    expect(JSON.stringify(shoppingGuideContent)).not.toContain(
      "製品の修理に関するお問い合わせはこちら"
    );
  });
});
