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

  // 登録番号が入るまでは登録番号の行を出さない
  it("登録番号の有無で印字を切り替える", () => {
    expect(
      readSource("components/commerce/AccountReceiptContent.tsx")
    ).toContain("isQualifiedInvoiceReady()");
    expect(readSource("components/commerce/ReceiptSheet.tsx")).toContain(
      "{registrationNumber ? ("
    );
  });
});

describe("領収書の体裁", () => {
  const sheetSource = () => readSource("components/commerce/ReceiptSheet.tsx");

  // 小計・送料・消費税を足すと合計に一致させる
  it("小計は合計から送料と消費税を引いた額にする", () => {
    expect(
      readSource("components/commerce/AccountReceiptContent.tsx")
    ).toContain("subtotal={total - shipping - tax}");
  });

  it("宛名と但し書きは購入者に入力させない", () => {
    const source = readSource("components/commerce/AccountReceiptContent.tsx");

    expect(source).not.toContain("<form");
    expect(source).not.toContain("但し");
    expect(readSource("app/account/receipt/page.tsx")).not.toContain("note");
  });

  it("操作は PDF ダウンロードのボタンだけ", () => {
    expect(readSource("components/commerce/ReceiptPrintButton.tsx")).toContain(
      "PDFダウンロード"
    );
  });

  // 紙の書類なので、文字だけ縮む Text Scale では比率が崩れる
  it("寸法は用紙の幅に対する割合で持つ", () => {
    expect(sheetSource()).toContain("@container");
    expect(sheetSource()).not.toContain("--text-scale");
  });

  it("商品が少なくても明細の行数を保つ", () => {
    expect(sheetSource()).toContain("RECEIPT_MIN_DETAIL_ROWS");
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
