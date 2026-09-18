import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  RECEIPT_TAX_RATE_PERCENT,
  isQualifiedInvoiceReady,
  receiptIssuer,
} from "@/data/receipt";
import {
  ACCOUNT_RECEIPT_PATH,
  accountReceiptHref,
} from "@/lib/commerce/account-login";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../..");

function readSource(relativePath: string) {
  return readFileSync(join(rootDir, relativePath), "utf8");
}

describe("領収書の発行者情報", () => {
  it("会社情報と同じ発行者を使う", () => {
    expect(receiptIssuer.name).toBe("株式会社NSS");
    expect(receiptIssuer.address).toContain("大野城市");
  });

  // 番号を推測で埋めると、適格請求書として成立しない書類を配ってしまう
  it("登録番号が未設定なら適格請求書として扱わない", () => {
    if (receiptIssuer.invoiceRegistrationNumber.trim()) {
      expect(receiptIssuer.invoiceRegistrationNumber).toMatch(/^T\d{13}$/);
      expect(isQualifiedInvoiceReady()).toBe(true);
    } else {
      expect(isQualifiedInvoiceReady()).toBe(false);
    }
  });

  it("標準税率で集計する", () => {
    expect(RECEIPT_TAX_RATE_PERCENT).toBe(10);
  });

  // 登録番号が入るまでは税率別内訳を出さない
  it("登録番号の有無で印字を切り替える", () => {
    const source = readSource(
      "components/commerce/AccountReceiptContent.tsx"
    );

    expect(source).toContain("isQualifiedInvoiceReady()");
    expect(source).toContain("showRegistrationNumber");
  });
});

describe("領収書への導線", () => {
  it("注文 ID をエンコードしてリンクを組み立てる", () => {
    expect(accountReceiptHref("gid://shopify/Order/123")).toBe(
      `${ACCOUNT_RECEIPT_PATH}?order=gid%3A%2F%2Fshopify%2FOrder%2F123`
    );
  });

  it("注文一覧から領収書へ行ける", () => {
    expect(
      readSource("components/commerce/AccountPageContent.tsx")
    ).toContain("accountReceiptHref(order.id)");
  });

  // ヘッダーやフッターが混ざると領収書として使えない
  it("印刷では領収書だけを残す", () => {
    const styles = readSource("app/globals.css");

    expect(styles).toContain("@media print");
    expect(styles).toContain("[data-receipt-page]");
    expect(
      readSource("components/commerce/AccountReceiptContent.tsx")
    ).toContain("data-receipt-page");
  });
});
