import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AccountReceiptView } from "@/components/commerce/AccountReceiptContent";
import { invoiceDetailRows, ReturnInvoiceSheet, SimplifiedInvoiceSheet } from "@/components/commerce/InvoiceSheet";
import { INVOICE_RULES_VERSION, PROVISIONAL_INVOICE_TAX_CONFIG } from "@/lib/invoice/config";
import type { CustomerAccountInvoiceOrder } from "@/lib/invoice/customer-account-order";
import { customerReceiptFromAccountOrder } from "@/lib/invoice/customer-receipt";
import {
  customerReceiptView,
  invoiceFileName,
  RECEIPT_NOTICES,
  receiptNoticeFor,
  REFUND_NOTICES,
  RETURN_INVOICE_NOTICE,
  type CustomerReceiptView,
} from "@/lib/invoice/customer-receipt-view";
import type { InvoiceIssuePolicy } from "@/lib/invoice/eligibility";
import { yen } from "@/lib/invoice/money";
import { issueReason } from "@/lib/invoice/order";

import {
  agreement,
  CAPTURED_AT,
  cardSale,
  fulfillment,
  ITEMS,
  money,
  order,
  order1054,
  order1056,
  order1057,
  order1058,
  paidShipped1057,
  productSale,
  shippingSale,
  tax,
} from "./account-fixtures";
import { enabledPolicy, issuer } from "./fixtures";

function viewOf(input: CustomerAccountInvoiceOrder, policy: InvoiceIssuePolicy = enabledPolicy) {
  return customerReceiptView(
    customerReceiptFromAccountOrder(input, {
      capturedAt: CAPTURED_AT,
      issuer,
      rulesVersion: INVOICE_RULES_VERSION,
      taxConfig: PROVISIONAL_INVOICE_TAX_CONFIG,
      transactionDateBasis: "shippedAt",
      policy,
    })
  );
}

function issuable(view: CustomerReceiptView) {
  if (view.status !== "issuable") throw new Error(`発行できません: ${view.notice}`);
  return view;
}

/** 描画した帳票の文字だけ。タグを外し、空白をまとめる */
function sheetText(element: Parameters<typeof renderToStaticMarkup>[0]) {
  return renderToStaticMarkup(element)
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ");
}

/** テストデータのみ：8% の商品・割引のある商品・送料のある、入金済み・出荷済みの注文 */
const food = { id: "gid://shopify/LineItem/9", name: "コーヒー豆", price: 1080 };
const mixedOrder = order({
  name: "#TEST-MIX",
  agreements: {
    nodes: [
      agreement("gid://shopify/SalesAgreement/1", "ORDER", [
        productSale("gid://shopify/Sale/1", food, 1, 1080, 80, { taxes: [tax(80, 8)] }),
        productSale("gid://shopify/Sale/2", ITEMS.rope, 1, 2160, 196, { totalDiscountAmountAfterTaxes: money(240) }),
        shippingSale("gid://shopify/Sale/3", 1100, 100),
      ]),
    ],
  },
  transactions: [cardSale(4340)],
  fulfillments: {
    nodes: [
      fulfillment("gid://shopify/Fulfillment/1", "SUCCESS", "2026-10-05T01:00:00Z", [
        { id: food.id, quantity: 1 },
        { id: ITEMS.rope.id, quantity: 1 },
      ]),
    ],
  },
});

describe("お客様への案内（customerReceiptView）", () => {
  it("取得の失敗・本人の注文でない・読み込めないデータは、内部の事情を出さず決まった案内にする", () => {
    expect(customerReceiptView({ status: "fetchFailed" })).toEqual({ status: "notice", notice: "fetchFailed", refunds: null });
    expect(customerReceiptView({ status: "failed" })).toEqual({ status: "notice", notice: "fetchFailed", refunds: null });
    expect(customerReceiptView({ status: "notFound" })).toEqual({ status: "notice", notice: "notFound", refunds: null });
    expect(
      customerReceiptView({ status: "invalidData", reasons: [issueReason("invalidData", "円以外の通貨は扱いません: USD")] })
    ).toEqual({ status: "notice", notice: "contact", refunds: null });
  });

  it("案内の文言に、判定の理由のコードや API の言葉を含めない", () => {
    for (const text of Object.values(RECEIPT_NOTICES)) {
      expect(text).not.toMatch(/[A-Za-z]{3,}|gid:|token|error/i);
    }
    expect(RECEIPT_NOTICES.awaitingShipment).toBe("領収書は商品発送後にご確認いただけます。");
    expect(RECEIPT_NOTICES.contact).toBe("現在、領収書を表示できません。お手数ですが、お問い合わせください。");
    expect(RECEIPT_NOTICES.fetchFailed).toBe("領収書の取得に失敗しました。時間をおいて再度お試しください。");
  });

  it("待てば発行できる理由だけなら入金待ち・発送待ちを、それ以外が混ざればお問い合わせを案内する", () => {
    const reasons = (...codes: string[]) => codes.map((code) => issueReason(code, ""));

    expect(receiptNoticeFor(reasons("notShipped", "awaitingShipment"))).toBe("awaitingShipment");
    expect(receiptNoticeFor(reasons("unpaid", "notShipped", "awaitingShipment"))).toBe("awaitingPayment");
    expect(receiptNoticeFor(reasons("notShipped", "orderEdited"))).toBe("contact");
    expect(receiptNoticeFor(reasons("multipleShipmentDates"))).toBe("contact");
    expect(receiptNoticeFor([])).toBe("contact");
  });

  it("実データ #1056〜#1058（入金前キャンセル）：領収書を発行できる状態にしない", () => {
    for (const input of [order1056, order1057, order1058]) {
      expect(viewOf(input)).toEqual({ status: "notice", notice: "cancelled", refunds: null });
    }
  });

  it("テストデータのみ：入金済み・発送前は発送待ち、未入金は入金待ちを案内する", () => {
    const unshipped = { ...order1054, fulfillments: { nodes: [] } };
    const unpaid = {
      ...unshipped,
      financialStatus: "PENDING",
      transactions: [{ ...cardSale(17710), status: "PENDING", type: "BANK_DEPOSIT" }],
    };

    expect(viewOf(unshipped)).toMatchObject({ status: "notice", notice: "awaitingShipment" });
    expect(viewOf(unpaid)).toMatchObject({ status: "notice", notice: "awaitingPayment" });
  });

  it("テストデータのみ：取消済みの出荷しかない注文は発送前として扱う", () => {
    const cancelledOnly = {
      ...order1054,
      fulfillments: { nodes: [order1054.fulfillments.nodes[0]] },
    };

    expect(viewOf(cancelledOnly)).toMatchObject({ status: "notice", notice: "awaitingShipment" });
  });

  it("テストデータのみ：未出荷の商品に返金がある注文は、発送待ちにせずお問い合わせを案内する", () => {
    const refundedBeforeShipment = {
      ...paidShipped1057([
        { id: "gid://shopify/Refund/20", amount: 1740, sales: [productSale("gid://shopify/Sale/r1", ITEMS.fitting, -1, -1740, -158)] },
      ]),
      fulfillments: { nodes: [] },
    };

    expect(viewOf(refundedBeforeShipment)).toMatchObject({ status: "notice", notice: "contact" });
  });

  it("テストデータのみ：注文編集・税額の不一致はお問い合わせを案内する", () => {
    expect(viewOf({ ...order1054, edited: true })).toMatchObject({ notice: "contact" });
    expect(viewOf({ ...order1054, transactions: [cardSale(17000)] })).toMatchObject({ notice: "contact" });
  });

  it("運用で停止中（本番の仮の設定）なら、条件のそろった注文でも発行しない", () => {
    expect(viewOf(order1054, { memberPageIssueEnabled: false, returnInvoiceEnabled: false })).toMatchObject({
      status: "notice",
      notice: "contact",
    });
  });

  it("テストデータのみ：一部返金は、当初の領収書・返金の状況・返還請求書を分けて返す", () => {
    const refunded = paidShipped1057([
      { id: "gid://shopify/Refund/20", amount: 1740, sales: [productSale("gid://shopify/Sale/r1", ITEMS.fitting, -1, -1740, -158)] },
    ]);
    const view = issuable(viewOf(refunded));

    expect(view.invoice.taxSummary).toMatchObject({ total: 6980, tax: 635 });
    expect(view.refunds).toEqual({ refunded: 1740, pending: 0, failed: false, needsReview: false });
    expect(view.returnInvoices.map((document) => document.taxSummary.total)).toEqual([1740]);
    expect(view.returnInvoiceWithheld).toBe(false);

    // 返還請求書を止めている運用（本番の仮の設定）では、作らずに案内だけを出す
    const withheld = issuable(viewOf(refunded, { memberPageIssueEnabled: true, returnInvoiceEnabled: false }));
    expect(withheld.returnInvoices).toEqual([]);
    expect(withheld.returnInvoiceWithheld).toBe(true);
    expect(withheld.refunds?.refunded).toBe(1740);
  });

  it("ファイル名は注文番号だけで決め、閲覧した日で変わらない", () => {
    const view = issuable(viewOf(order1054));

    expect(invoiceFileName(view.invoice)).toBe("領収書兼適格簡易請求書_1054");
  });
});

describe("領収書のページ（AccountReceiptView）", () => {
  const pageText = (view: CustomerReceiptView) => sheetText(createElement(AccountReceiptView, { view }));

  it("案内だけを出すときは帳票も PDF のボタンも出さない", () => {
    for (const notice of ["notFound", "awaitingPayment", "awaitingShipment", "cancelled", "contact", "fetchFailed"] as const) {
      const html = renderToStaticMarkup(createElement(AccountReceiptView, { view: { status: "notice", notice, refunds: null } }));

      expect(html).toContain(RECEIPT_NOTICES[notice]);
      expect(html).not.toContain("data-receipt-sheet");
      expect(html).not.toContain("PDFダウンロード");
    }
  });

  it("実データ #1054：領収書と PDF のボタンを出し、返金の状況は出さない", () => {
    const text = pageText(viewOf(order1054));

    expect(text).toContain("PDFダウンロード");
    expect(text).toContain("領収書 兼 適格簡易請求書");
    expect(text).not.toContain("ご返金の状況");
  });

  it("テストデータのみ：返金があれば、領収書とは別に返金の状況と返還請求書を出す", () => {
    const refunded = paidShipped1057([
      { id: "gid://shopify/Refund/20", amount: 1740, sales: [productSale("gid://shopify/Sale/r1", ITEMS.fitting, -1, -1740, -158)] },
    ]);
    const enabled = pageText(viewOf(refunded));
    const withheld = pageText(viewOf(refunded, { memberPageIssueEnabled: true, returnInvoiceEnabled: false }));

    expect(enabled).toContain("ご返金済み：1,740円");
    expect(enabled).toContain("適格返還請求書のPDFダウンロード");
    expect(enabled.indexOf("領収書 兼 適格簡易請求書")).toBeLessThan(enabled.indexOf("ご返金の状況"));
    expect(withheld).toContain("ご返金済み：1,740円");
    expect(withheld).toContain(RETURN_INVOICE_NOTICE);
    expect(withheld).not.toContain("適格返還請求書のPDFダウンロード");
  });

  it("返金の手続き中・失敗・要確認を案内する", () => {
    const text = pageText({
      status: "notice",
      notice: "contact",
      refunds: { refunded: yen(0), pending: yen(1740), failed: true, needsReview: true },
    });

    expect(text).toContain("ご返金の手続き中：1,740円");
    expect(text).toContain(REFUND_NOTICES.failed);
    expect(text).toContain(REFUND_NOTICES.needsReview);
  });
});

describe("領収書 兼 適格簡易請求書の帳票", () => {
  it("実データ #1054：法定記載事項と領収の事実を載せ、発行日・宛名は載せない", () => {
    const view = issuable(viewOf(order1054));
    const text = sheetText(createElement(SimplifiedInvoiceSheet, { document: view.invoice }));

    for (const expected of [
      "領収書 兼 適格簡易請求書",
      "株式会社NSS",
      "C AND+S",
      "登録番号 T5290001041852",
      "取引年月日 2026年10月9日",
      "決済日 2026年10月1日",
      "注文番号 #1054",
      "領収金額 ¥17,710 （税込） うち消費税額 1,610円",
      "グランドシート",
      "10%対象 17,710円 1,610円",
      "合計 17,710円 1,610円",
      "金額はすべて税込です。",
    ]) {
      expect(text).toContain(expected);
    }
    expect(text).not.toContain("¥17,710-");
    expect(text).not.toContain("発行日");
    expect(text).not.toContain("領収日");
    expect(text).not.toContain("様");
    expect(text).not.toContain("軽減税率");
  });

  // Shopify の決済の記録の日を、実際にお金が届いた日と同じものとして書かない
  it("領収の日付は決済の記録の種類どおりに示す（カードは決済日、手動の決済は入金確認日）", () => {
    const { invoice } = issuable(viewOf(order1054));
    const manual = { ...invoice, receipt: { ...invoice.receipt, manualPayment: true } };

    expect(sheetText(createElement(SimplifiedInvoiceSheet, { document: manual }))).toContain(
      "入金確認日 2026年10月1日"
    );
  });

  it("割引の行は前の行と同じページに置く印を付け、PDF のページ分けの目印を持つ", () => {
    const view = issuable(viewOf(mixedOrder));
    const html = renderToStaticMarkup(createElement(SimplifiedInvoiceSheet, { document: view.invoice }));

    expect(html.match(/data-receipt-keep-with-previous="true"/g)).toHaveLength(1);
    expect(html).toContain("data-receipt-detail");
    expect(html).toContain('data-receipt-continuation="領収書 兼 適格簡易請求書（続き）　ご注文 #TEST-MIX"');
  });

  it("テストデータのみ：8% の商品に印を付け、割引・送料を行で示し、税率ごとに集計する", () => {
    const view = issuable(viewOf(mixedOrder));
    const text = sheetText(createElement(SimplifiedInvoiceSheet, { document: view.invoice }));

    for (const expected of [
      "コーヒー豆 ※ 1 1,080 1,080",
      "ガイロープ 1 2,400 2,400 └ 割引 −240",
      "送料（通常配送） 1,100",
      "10%対象 3,260円 296円",
      "8%対象（軽減税率） 1,080円 80円",
      "合計 4,340円 376円",
      "※は軽減税率（8%）の対象です。",
      "うち消費税額 376円",
    ]) {
      expect(text).toContain(expected);
    }
  });

  it("テストデータのみ：明細の金額の合計は、税率ごとの合計・領収金額と一致する", () => {
    const view = issuable(viewOf(mixedOrder));

    expect(detailAmounts(view.invoice).reduce((sum, amount) => sum + amount, 0)).toBe(view.invoice.taxSummary.total);
    expect(view.invoice.receipt.receivedAmount).toBe(view.invoice.taxSummary.total);
  });

  // 商品が少ない注文でも、空の行で表の高さを埋めない
  it("明細は商品・割引・送料の行だけで、空の行を足さない", () => {
    const view = issuable(viewOf(order1054));

    expect(detailAmounts(view.invoice)).toEqual(view.invoice.lines.map((line) => line.unitPrice * line.quantity));
    expect(detailHtml(view.invoice).match(/<tr/g)).toHaveLength(1 + view.invoice.lines.length);
  });

  it("割引のない注文には割引の行を出さない", () => {
    const view = issuable(viewOf(order1054));

    expect(view.invoice.lines.every((line) => line.discount === 0)).toBe(true);
    expect(sheetText(createElement(SimplifiedInvoiceSheet, { document: view.invoice }))).not.toContain("割引");
  });

  it("請求額 0 円の送料は出さず、割引のある送料は割引も並べる（書類の送料の記録は変えない）", () => {
    const { invoice } = issuable(viewOf(mixedOrder));
    const shipping = invoice.shipping!;
    const free = { ...invoice, shipping: { ...shipping, discount: shipping.price, amount: yen(0) } };
    const discounted = { ...invoice, shipping: { ...shipping, discount: yen(100), amount: yen(shipping.price - 100) } };

    expect(invoiceDetailRows(free).some((row) => row.key.startsWith("shipping"))).toBe(false);
    expect(free.shipping.price).toBe(1100);
    expect(invoiceDetailRows({ ...invoice, shipping: null }).some((row) => row.key.startsWith("shipping"))).toBe(false);
    expect(
      invoiceDetailRows(discounted)
        .filter((row) => row.key.startsWith("shipping"))
        .map(({ description, amount, attachedToPrevious }) => [description, amount, attachedToPrevious ?? false])
    ).toEqual([
      ["送料（通常配送）", 1100, false],
      ["└ 送料の割引", -100, true],
    ]);
  });

  // 表示の整理で書類の値を変えていない
  it("帳票を描いても、書類の金額・税額・法定記載事項の値は変わらない", () => {
    const view = issuable(viewOf(mixedOrder));
    const before = structuredClone(view.invoice);

    renderToStaticMarkup(createElement(SimplifiedInvoiceSheet, { document: view.invoice }));
    expect(view.invoice).toEqual(before);
    expect(view.invoice.taxSummary.rates.map((rate) => [rate.ratePercent, rate.totalIncludingTax, rate.tax])).toEqual([
      [10, 3260, 296],
      [8, 1080, 80],
    ]);
  });
});

function detailHtml(document: Parameters<typeof SimplifiedInvoiceSheet>[0]["document"]) {
  const html = renderToStaticMarkup(createElement(SimplifiedInvoiceSheet, { document }));

  return html.slice(html.indexOf("data-receipt-detail"), html.indexOf("data-receipt-summary"));
}

/** 明細の表の、各行の金額（右端の列） */
function detailAmounts(document: Parameters<typeof SimplifiedInvoiceSheet>[0]["document"]) {
  return [...detailHtml(document).matchAll(/<tr[^>]*>(?:(?!<\/tr>).)*?<td[^>]*>([−\d,]+)<\/td><\/tr>/g)].map((match) =>
    Number(match[1].replace("−", "-").replace(/,/g, ""))
  );
}

describe("適格返還請求書の帳票", () => {
  it("テストデータのみ：返還年月日・元の取引年月日・返還金額と消費税額を載せ、領収書を兼ねない", () => {
    const view = issuable(
      viewOf(
        paidShipped1057([
          { id: "gid://shopify/Refund/20", amount: 1740, sales: [productSale("gid://shopify/Sale/r1", ITEMS.fitting, -1, -1740, -158)] },
        ])
      )
    );
    const text = sheetText(createElement(ReturnInvoiceSheet, { document: view.returnInvoices[0] }));

    for (const expected of [
      "適格返還請求書",
      "登録番号 T5290001041852",
      "返還年月日 2026年10月12日",
      "元の取引年月日 2026年10月5日",
      "返還金額 ¥1,740 （税込） うち消費税額 158円",
      "三角自在金具 6個セット 1 1,740",
      "10%対象 1,740円 158円",
    ]) {
      expect(text).toContain(expected);
    }
    expect(text).not.toContain("領収");
    expect(invoiceFileName(view.returnInvoices[0], 0)).toBe("適格返還請求書_TEST-1057_1");
  });
});
