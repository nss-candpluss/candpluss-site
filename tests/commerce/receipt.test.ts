import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  RECEIPT_DOCUMENT_TITLE,
  RECEIPT_GUIDE_NOTICE_ENABLED,
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
import { buildImagePdf, deflate, paginateSheet } from "@/lib/commerce/receipt-pdf";
import { INVOICE_DOCUMENT_TITLES } from "@/lib/invoice/documents";

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
    const source = readSource("components/commerce/InvoiceSheet.tsx");
    const order = [
      "{document.issuer.brandName}",
      "TEL：{receiptIssuer.tel}",
      "運営：{document.issuer.name}",
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

  // 登録番号の無い書類は発行の判定（法定記載事項）で止めるので、帳票では必ず印字する
  it("領収書・返還請求書とも登録番号を印字する", () => {
    const source = readSource("components/commerce/InvoiceSheet.tsx");

    expect(source.match(/registrationRow\(document\)/g)).toHaveLength(2);
  });
});

describe("領収書の体裁", () => {
  const sheetSource = () => readSource("components/commerce/InvoiceSheet.tsx");

  // 送料も税込で課税。税込の合計から割り戻す
  it("税抜合計・送料（税抜）・消費税を足すと合計金額になる", () => {
    // ガイロープ 2,400 円＋送料 700 円。送料に課税した Shopify のチェックアウトでも 282 円
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

  it("表題は領収書 兼 適格簡易請求書で、画面・タイトル・リンク・ファイル名で揃える", () => {
    expect(RECEIPT_DOCUMENT_TITLE).toBe("領収書 兼 適格簡易請求書");
    expect(RECEIPT_DOCUMENT_TITLE).toBe(INVOICE_DOCUMENT_TITLES.invoice);
    expect(readSource("components/commerce/InvoiceSheet.tsx")).toContain("INVOICE_DOCUMENT_TITLES.invoice");

    for (const path of [
      "components/commerce/AccountPageContent.tsx",
      "app/account/receipt/page.tsx",
      "app/shopify-test/account/receipt/page.tsx",
    ]) {
      expect(readSource(path), path).toContain("RECEIPT_DOCUMENT_TITLE");
    }
  });

  // 旧来の明細書のファイル名。発行日は日本時間で数える。UTC のままだと朝 9 時前の注文が前日になる
  it("旧来のファイル名は「表題_注文番号_発行日」", () => {
    expect(receiptFileName("#1024", "2026-10-01T05:00:00Z")).toBe(
      "領収書 兼 適格簡易請求書_1024_20261001"
    );
    expect(receiptFileName("#1025", "2026-10-01T16:30:00Z")).toBe(
      "領収書 兼 適格簡易請求書_1025_20261002"
    );
  });

  // 閲覧した日で変わらないよう、領収書のページは発行日を使わない
  it("領収書のページのファイル名は使わない日付を含めず、閲覧した日で変わらない", () => {
    const source = readSource("components/commerce/AccountReceiptContent.tsx");

    expect(source).toContain("invoiceFileName(view.invoice)");
    expect(source).not.toContain("receiptFileName");
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

    expect(buttonSource).toContain("downloadReceiptPdf(fileName, sheetKey)");
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
    expect(readSource("components/commerce/InvoiceSheet.tsx")).toContain(
      "data-receipt-sheet={sheetKey}"
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
  const pdfText = async (pageCount = 1) => {
    const page = {
      width: 2,
      height: 3,
      compressedGray: await deflate(new Uint8Array(6).fill(255)),
    };
    const blob = buildImagePdf({
      pages: Array.from({ length: pageCount }, () => page),
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

  it("複数ページの PDF は、ページごとに自分の画像を指す", async () => {
    const { text } = await pdfText(3);
    const xrefAt = Number(text.match(/startxref\n(\d+)\n/)?.[1]);
    const offsets = [...text.slice(xrefAt).matchAll(/^(\d{10}) 00000 n $/gm)].map(
      (match) => Number(match[1])
    );

    expect(text).toContain("/Kids [3 0 R 6 0 R 9 0 R] /Count 3");
    expect(text).toContain("/XObject << /Im0 11 0 R >> >> /Contents 10 0 R");
    expect(offsets).toHaveLength(12);
    offsets.forEach((offset, index) => {
      expect(text.slice(offset).startsWith(`${index + 1} 0 obj`)).toBe(true);
    });
  });
});

describe("PDF のページ分け", () => {
  // 行の下辺が 100, 200, … の明細。1 ページに 450 まで描け、続きのページは見出しに 100 使う
  const rowBottoms = (count: number) => Array.from({ length: count }, (_, index) => (index + 1) * 100);

  it("1 ページに収まれば分けない", () => {
    expect(paginateSheet({ height: 450, pageHeight: 450, repeatHeight: 100, breaks: rowBottoms(4) })).toEqual([
      { top: 0, bottom: 450 },
    ]);
  });

  it("行の切れ目でだけ切り、続きのページは見出しの分だけ短くする", () => {
    expect(paginateSheet({ height: 1000, pageHeight: 450, repeatHeight: 100, breaks: rowBottoms(9) })).toEqual([
      { top: 0, bottom: 400 },
      { top: 400, bottom: 700 },
      { top: 700, bottom: 1000 },
    ]);
  });

  it("切れる位置が無ければ、縮めたり行を割ったりせずに諦める", () => {
    expect(paginateSheet({ height: 1000, pageHeight: 450, repeatHeight: 100, breaks: [600] })).toBeNull();
  });

  it("割引の行は商品の行と離さず、最後の行の下では切らない", () => {
    const source = readSource("lib/commerce/receipt-pdf.ts");

    expect(source).toContain('hasAttribute("data-receipt-keep-with-previous")');
    expect(source).toContain(".slice(0, -1)");
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
  it("領収書へのリンクとページは表示の切り替えで止めている", () => {
    expect(RECEIPT_ISSUE_ENABLED).toBe(false);
    expect(readSource("components/commerce/AccountPageContent.tsx")).toContain(
      "{RECEIPT_ISSUE_ENABLED && accountOrderHasReceipt(order) ? ("
    );
    // URL を直接開いても出さない
    expect(readSource("components/commerce/AccountReceiptContent.tsx")).toContain(
      "if (!RECEIPT_ISSUE_ENABLED) {\n    notFound();"
    );
  });

  // 本番の動作確認で会員ページの発行だけを開けても、公開中のショッピングガイドの文面は変えない
  it("ショッピングガイドの案内は、会員ページの発行とは別に切り替える", () => {
    expect(RECEIPT_GUIDE_NOTICE_ENABLED).toBe(false);
    const guideSource = readSource("data/shoppingGuide.ts");

    expect(guideSource).toContain("...(RECEIPT_GUIDE_NOTICE_ENABLED");
    expect(guideSource).not.toContain("RECEIPT_ISSUE_ENABLED");
  });

  // 現在の合計（キャンセル・返金後）や請求先の氏名を、当初の購入金額・宛名として使わない
  it("領収書のページは注文時の販売記録から組み立てた書類だけを表示する", () => {
    const source = readSource("components/commerce/AccountReceiptContent.tsx");

    expect(source).toContain("loadCustomerReceipt(session.accessToken, orderId)");
    for (const legacy of ["fetchCustomerOrder", "totalPrice", "billingAddress", "receiptSummaryAmounts", "ReceiptSheet "]) {
      expect(source).not.toContain(legacy);
    }
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
