import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  RECEIPT_DOCUMENT_TITLE,
  RECEIPT_ISSUE_ENABLED,
  RECEIPT_TAX_RATE_PERCENT,
  isQualifiedInvoiceReady,
  receiptFileName,
  receiptIssuer,
  receiptLineDescription,
  receiptSummaryAmounts,
} from "@/data/receipt";
import {
  ACCOUNT_RECEIPT_PATH,
  accountReceiptHref,
} from "@/lib/commerce/account-login";
import { buildImagePdf, deflate } from "@/lib/commerce/receipt-pdf";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../..");

function readSource(relativePath: string) {
  return readFileSync(join(rootDir, relativePath), "utf8");
}

describe("領収書の発行者情報", () => {
  it("会社情報と同じ発行者を使う", () => {
    expect(receiptIssuer.name).toBe("株式会社NSS");
    expect(receiptIssuer.address).toContain("大野城市");
  });

  // 屋号と問い合わせ先を先に、運営会社を後に並べる
  it("屋号・TEL・運営会社・住所の順に並べる", () => {
    const source = readSource("components/commerce/ReceiptSheet.tsx");
    const order = [
      "{receiptIssuer.brandName}",
      "TEL：{receiptIssuer.tel}",
      "運営：{receiptIssuer.name}",
      "{receiptIssuer.postalCode}",
      "{receiptIssuer.address}",
    ].map((text) => source.indexOf(text));

    expect(receiptIssuer.brandName).toBe("C AND+S");
    expect(receiptIssuer.tel).toBe("0120-64-8175");
    expect(order.every((index) => index >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
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

  // 送料も税込。Shopify の税額（送料の分を含まない）は使わず、税込の合計から割り戻す
  it("税抜合計・送料（税抜）・消費税を足すと合計金額になる", () => {
    // ガイロープ 2,400 円＋送料 700 円。Shopify の税額は商品分の 218 円だけ
    expect(receiptSummaryAmounts({ total: 3100, shipping: 700 })).toEqual({
      subtotalExcludingTax: 2182,
      shippingExcludingTax: 636,
      tax: 282,
      total: 3100,
    });
    expect(receiptSummaryAmounts({ total: 494060, shipping: 0 })).toEqual({
      subtotalExcludingTax: 449145,
      shippingExcludingTax: 0,
      tax: 44915,
      total: 494060,
    });

    for (const [total, shipping] of [
      [3100, 700],
      [5699, 700],
      [372000, 0],
    ]) {
      const amounts = receiptSummaryAmounts({ total, shipping });

      expect(
        amounts.subtotalExcludingTax + amounts.shippingExcludingTax + amounts.tax
      ).toBe(total);
    }
  });

  it("表題は利用明細書（兼 適格請求書）で、画面・タイトル・リンク・ファイル名で揃える", () => {
    expect(RECEIPT_DOCUMENT_TITLE).toBe("利用明細書（兼 適格請求書）");

    for (const path of [
      "components/commerce/ReceiptSheet.tsx",
      "components/commerce/AccountPageContent.tsx",
      "app/account/receipt/page.tsx",
      "app/shopify-test/account/receipt/page.tsx",
    ]) {
      expect(readSource(path), path).toContain("RECEIPT_DOCUMENT_TITLE");
    }
  });

  // 発行日は日本時間で数える。UTC のままだと朝 9 時前の注文が前日になる
  it("ファイル名は「表題_注文番号_発行日」", () => {
    expect(receiptFileName("#1024", "2026-10-01T05:00:00Z")).toBe(
      "利用明細書（兼 適格請求書）_1024_20261001"
    );
    expect(receiptFileName("#1025", "2026-10-01T16:30:00Z")).toBe(
      "利用明細書（兼 適格請求書）_1025_20261002"
    );
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

  // 印刷ダイアログを挟まずに保存させる。OSS のライブラリは使わない
  it("押したらその場で PDF を保存し、ライブラリに頼らない", () => {
    const buttonSource = readSource("components/commerce/ReceiptPrintButton.tsx");
    const pdfSource = readSource("lib/commerce/receipt-pdf.ts");
    const packageJson = readSource("package.json");

    expect(buttonSource).toContain("downloadReceiptPdf(fileName)");
    expect(pdfSource).toContain("link.download = fileName");
    for (const library of ["html2canvas", "jspdf"]) {
      expect(packageJson).not.toContain(library);
      expect(pdfSource).not.toContain(library);
    }
  });

  it("PDF にするのは帳票の部分だけ", () => {
    expect(readSource("lib/commerce/receipt-pdf.ts")).toContain(
      "[data-receipt-sheet]"
    );
    expect(readSource("components/commerce/ReceiptSheet.tsx")).toContain(
      "data-receipt-sheet"
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

  // マスごとに線を引くと、境目だけ二重になって太く見える
  it("PDF の罫線は共有している線を 1 本にまとめて引く", () => {
    const source = readSource("lib/commerce/receipt-pdf.ts");

    expect(source).toContain("drawn.has(key)");
  });
});

describe("明細の摘要", () => {
  // Shopify の name は「商品名 - 色」まで含む。そのままつなぐと色が二重になる
  it("商品名と色・サイズを全角空白でつなぎ、二重に出さない", () => {
    expect(
      receiptLineDescription("MOYA500 - Classic Yellow", "Classic Yellow")
    ).toBe("MOYA500　Classic Yellow");
    expect(receiptLineDescription("ZIG STAKE - 20cm", "20cm")).toBe(
      "ZIG STAKE　20cm"
    );
    expect(
      receiptLineDescription(
        "MOYA500 TPUウインドウ - Classic Yellow",
        "Classic Yellow"
      )
    ).toBe("MOYA500 TPUウインドウ　Classic Yellow");
  });

  it("色・サイズの無い商品は商品名だけ", () => {
    expect(receiptLineDescription("ガイロープ", "Default Title")).toBe("ガイロープ");
    expect(receiptLineDescription("ガイロープ", null)).toBe("ガイロープ");
  });
});

describe("PDF の組み立て", () => {
  const pdfText = async () => {
    const blob = buildImagePdf({
      width: 2,
      height: 3,
      compressedGray: await deflate(new Uint8Array(6).fill(255)),
      title: "領収書_1024",
    });

    return {
      blob,
      text: Buffer.from(await blob.arrayBuffer()).toString("latin1"),
    };
  };

  it("A4 縦 1 ページの PDF になる", async () => {
    const { blob, text } = await pdfText();

    expect(blob.type).toBe("application/pdf");
    expect(text.startsWith("%PDF-1.4\n")).toBe(true);
    expect(text).toContain("/MediaBox [0 0 595.28 841.89]");
    expect(text).toContain("/Count 1");
    expect(text.trimEnd().endsWith("%%EOF")).toBe(true);
  });

  // 目次の位置がずれていると、ビューアによっては開けないか修復を求められる
  it("目次（xref）の位置が各オブジェクトの先頭を指している", async () => {
    const { text } = await pdfText();
    const xrefAt = Number(text.match(/startxref\n(\d+)\n/)?.[1]);

    expect(text.slice(xrefAt, xrefAt + 4)).toBe("xref");

    const offsets = [...text.slice(xrefAt).matchAll(/^(\d{10}) 00000 n $/gm)].map(
      (match) => Number(match[1])
    );

    expect(offsets).toHaveLength(6);
    offsets.forEach((offset, index) => {
      expect(text.slice(offset).startsWith(`${index + 1} 0 obj`)).toBe(true);
    });
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

  // 返金後の記載がインボイスの要件を満たすか確認できるまで、リンクは出さない
  it("利用明細書へのリンクは表示の切り替えで止めている", () => {
    expect(RECEIPT_ISSUE_ENABLED).toBe(false);
    expect(readSource("components/commerce/AccountPageContent.tsx")).toContain(
      "{RECEIPT_ISSUE_ENABLED && accountOrderHasReceipt(order) ? ("
    );
    // URL を直接開いても出さない
    expect(readSource("components/commerce/AccountReceiptContent.tsx")).toContain(
      "if (!RECEIPT_ISSUE_ENABLED) {\n    notFound();"
    );
  });

  // 会員ページを開いたまま、注文ごとに領収書を出せるようにする
  it("領収書は別タブで開く", () => {
    const source = readSource("components/commerce/AccountPageContent.tsx");
    const linkSource = source.slice(
      source.indexOf("accountReceiptHref(order.id)"),
      source.indexOf("{RECEIPT_DOCUMENT_TITLE}")
    );

    expect(linkSource).toContain('target="_blank"');
    expect(linkSource).toContain('rel="noopener noreferrer"');
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
