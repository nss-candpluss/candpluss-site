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

  it("lists sections in the published shopping-guide order", () => {
    expect(shoppingGuideContent.sections.map((entry) => entry.title)).toEqual([
      "1.ご注文について",
      "2.在庫について",
      "3.お支払いについて",
      "4.送料・配送について",
      "5.返品・交換・キャンセルについて",
      "6.領収書、納品書について",
    ]);
  });

  it("aligns shipping, delivery, payment, and returns with the published copy", () => {
    const shipping = JSON.stringify(section("4.送料・配送について"));
    const stock = JSON.stringify(section("2.在庫について"));
    const payment = JSON.stringify(section("3.お支払いについて"));
    const receipt = JSON.stringify(section("6.領収書、納品書について"));
    const returns = section("5.返品・交換・キャンセルについて")?.subsections[0]?.blocks ?? [];
    const legalReturns = item("返品・交換・キャンセルについて")?.blocks ?? [];

    expect(shipping).toContain("全国一律700円（税込価格5,000円以上で送料無料）");
    expect(shipping).toContain("各種決済手数料（振込手数料など）");
    expect(shipping).toContain("ご注文確認後、通常3営業日以内に発送");
    expect(shipping).toContain("ヤマト運輸 / 佐川急便 / 日本郵便");
    expect(shipping).not.toContain("990円");
    expect(shipping).not.toContain("代引き手数料");
    expect(shipping).not.toContain("海外配送について");
    expect(shipping).not.toContain("スマートクラブ");
    expect(shipping).not.toContain("クロネコメンバーズ");
    expect(stock).not.toContain("入荷通知について");
    expect(payment).toContain("クレジットカード決済、Google Pay、Apple Pay、銀行振込");
    expect(payment).toContain("■Shop Pay");
    expect(payment).toContain("ネットショップシステムShopifyが提供する決済サービスです");
    expect(payment).toContain("6桁のショップペイコード（SMS認証）");
    expect(payment).toContain("Shop Pay ログインページは こちら>>");
    expect(payment).toContain("Shop Pay アカウント削除ページは こちら>>");
    expect(payment).toContain("お支払い期限はご注文日より1週間以内です");
    expect(payment).toContain("振込手数料は、ご負担頂けますようお願い申し上げます。");
    expect(receipt).toContain("納品書は、お届けする製品に同梱し発送いたします。");
    expect(receipt).not.toContain("領収書は発行後の宛名");
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
