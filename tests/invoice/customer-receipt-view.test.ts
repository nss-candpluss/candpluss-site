import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AccountReceiptView } from "@/components/commerce/AccountReceiptContent";
import { invoiceDetailRows, ReturnInvoiceSheet, SimplifiedInvoiceSheet } from "@/components/commerce/InvoiceSheet";
import { invoiceStatementBreakdown } from "@/lib/invoice/documents";
import { invoiceOrderFromCustomerAccount } from "@/lib/invoice/customer-account-order";
import { saleTaxBreakdown } from "@/lib/invoice/order";
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

    expect(invoiceFileName(view.invoice)).toBe("利用明細書（兼適格簡易請求書）_1054");
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
    expect(text).toContain("利用明細書（兼 適格簡易請求書）");
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
    expect(enabled.indexOf("利用明細書（兼 適格簡易請求書）")).toBeLessThan(enabled.indexOf("ご返金の状況"));
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

/**
 * テストデータのみ：10% のガイロープと送料の、入金済み・出荷済みの注文。税額は Shopify が割り振った
 * 販売記録の値として渡す。`shipping` は割引後の送料、`shippingTax` が `null` なら税の明細の無い送料
 */
function ropeOrder(
  name: string,
  {
    discount = 0,
    ropeTax,
    shipping,
    shippingDiscount = 0,
    shippingTax,
  }: { discount?: number; ropeTax: number; shipping: number; shippingDiscount?: number; shippingTax: number | null }
) {
  const ropeAmount = ITEMS.rope.price - discount;

  return order({
    name,
    agreements: {
      nodes: [
        agreement("gid://shopify/SalesAgreement/1", "ORDER", [
          productSale("gid://shopify/Sale/1", ITEMS.rope, 1, ropeAmount, ropeTax, {
            totalDiscountAmountAfterTaxes: money(discount),
          }),
          shippingSale("gid://shopify/Sale/2", shipping, shippingTax, {
            totalDiscountAmountAfterTaxes: money(shippingDiscount),
          }),
        ]),
      ],
    },
    transactions: [cardSale(ropeAmount + shipping)],
    fulfillments: {
      nodes: [fulfillment("gid://shopify/Fulfillment/1", "SUCCESS", "2026-10-05T01:00:00Z", [{ id: ITEMS.rope.id, quantity: 1 }])],
    },
  });
}

/** 税込 2,400 円の商品＋税込 700 円の送料（Shopify の税額 282 円 = 218 円＋送料 64 円） */
const ropeWithShipping = ropeOrder("#TEST-700", { ropeTax: 218, shipping: 700, shippingTax: 64 });
/** 上の注文の商品に 240 円の割引（税額 260 円 = 196 円＋送料 64 円） */
const discountedRope = ropeOrder("#TEST-DISCOUNT", { discount: 240, ropeTax: 196, shipping: 700, shippingTax: 64 });

function summaryOf(input: CustomerAccountInvoiceOrder) {
  const summary = issuable(viewOf(input)).invoice.statement;

  if (!summary) throw new Error("集計欄を作れません");
  return [summary.productsExcludingTax, summary.shippingExcludingTax, summary.tax, summary.total];
}

describe("利用明細書（兼 適格簡易請求書）の帳票", () => {
  it("実データ #1054：表題・法定記載事項・領収の事実・NSS 指定の集計欄を載せ、発行日・宛名は載せない", () => {
    const view = issuable(viewOf(order1054));
    const text = sheetText(createElement(SimplifiedInvoiceSheet, { document: view.invoice }));

    for (const expected of [
      "利用明細書（兼 適格簡易請求書）",
      "株式会社NSS",
      "C AND+S",
      "登録番号 T5290001041852",
      "取引年月日 2026年10月9日",
      "決済日 2026年10月1日",
      "注文番号 #1054",
      "領収金額 ¥17,710-",
      "上記の金額を正に領収いたしました。",
      "税抜合計 送料（税抜） 消費税（10%） 合計金額 16,100 円 0 円 1,610 円 17,710 円",
      "摘要 数量 税込金額 グランドシート 1 17,710",
    ]) {
      expect(text).toContain(expected);
    }
    for (const absent of ["発行日", "領収日", "様", "軽減税率", "送料（通常配送）", "割引"]) {
      expect(text).not.toContain(absent);
    }
  });

  // 領収の日付は、Shopify の決済の記録の日を実際にお金が届いた日と同じものとして書かない
  it("領収の日付は決済の記録の種類どおりに示す（カードは決済日、手動の決済は入金確認日）", () => {
    const { invoice } = issuable(viewOf(order1054));
    const manual = { ...invoice, receipt: { ...invoice.receipt, manualPayment: true } };

    expect(sheetText(createElement(SimplifiedInvoiceSheet, { document: manual }))).toContain(
      "入金確認日 2026年10月1日"
    );
  });

  it("集計欄：#1054 は 16,100・0・1,610・17,710 円、2,400 円＋送料 700 円は 2,182・636・282・3,100 円", () => {
    expect(summaryOf(order1054)).toEqual([16100, 0, 1610, 17710]);
    expect(summaryOf(ropeWithShipping)).toEqual([2182, 636, 282, 3100]);
    expect(sheetText(createElement(SimplifiedInvoiceSheet, { document: issuable(viewOf(ropeWithShipping)).invoice }))).toContain(
      "2,182 円 636 円 282 円 3,100 円"
    );
  });

  it("テストデータのみ：割引のある注文も、集計欄の 4 つの欄の合計が合計金額・領収金額・Shopify の税額と一致する", () => {
    const view = issuable(viewOf(discountedRope));
    const [products, shipping, tax, total] = summaryOf(discountedRope);

    expect([products, shipping, tax, total]).toEqual([1964, 636, 260, 2860]);
    expect(products + shipping + tax).toBe(total);
    expect(view.invoice.receipt.receivedAmount).toBe(total);
    for (const [input, expectedTax] of [
      [order1054, 1610],
      [ropeWithShipping, 282],
      [discountedRope, 260],
    ] as const) {
      const summary = summaryOf(input);

      expect(summary[0] + summary[1] + summary[2]).toBe(summary[3]);
      expect(summary[2]).toBe(expectedTax);
    }
  });

  it("テストデータのみ：明細は税込で、割引は商品の直後、送料は請求額があるときだけ出し、合計は合計金額と一致する", () => {
    const view = issuable(viewOf(discountedRope));
    const text = sheetText(createElement(SimplifiedInvoiceSheet, { document: view.invoice }));
    const html = renderToStaticMarkup(createElement(SimplifiedInvoiceSheet, { document: view.invoice }));

    expect(text).toContain("ガイロープ 1 2,400 割引 −240 送料（通常配送） 700");
    expect(html.match(/data-receipt-keep-with-previous="true"/g)).toHaveLength(1);
    expect(html).toContain("data-receipt-detail");
    expect(html).toContain('data-receipt-continuation="利用明細書（兼 適格簡易請求書）（続き）　ご注文 #TEST-DISCOUNT"');
    expect(detailAmounts(view.invoice).reduce((sum, amount) => sum + amount, 0)).toBe(view.invoice.taxSummary.total);
  });

  // 商品が少ない注文でも、空の行で表の高さを埋めない
  it("明細は商品・割引・送料の行だけで、空の行を足さない", () => {
    const view = issuable(viewOf(order1054));

    expect(detailAmounts(view.invoice)).toEqual(view.invoice.lines.map((line) => line.unitPrice * line.quantity));
    expect(detailHtml(view.invoice).match(/<tr/g)).toHaveLength(1 + view.invoice.lines.length);
  });

  it("請求額 0 円の送料は明細に出さず、割引のある送料は割引も並べる（書類の送料の記録は変えない）", () => {
    const { invoice } = issuable(viewOf(ropeWithShipping));
    const shipping = invoice.shipping!;
    const free = { ...invoice, shipping: { ...shipping, discount: shipping.price, amount: yen(0) } };
    const discounted = { ...invoice, shipping: { ...shipping, discount: yen(100), amount: yen(shipping.price - 100) } };

    expect(invoiceDetailRows(free).some((row) => row.key.startsWith("shipping"))).toBe(false);
    expect(free.shipping.price).toBe(700);
    expect(invoiceDetailRows({ ...invoice, shipping: null }).some((row) => row.key.startsWith("shipping"))).toBe(false);
    expect(
      invoiceDetailRows(discounted)
        .filter((row) => row.key.startsWith("shipping"))
        .map(({ description, amount, keepWithPrevious }) => [description, amount, keepWithPrevious ?? false])
    ).toEqual([
      ["送料（通常配送）", 700, false],
      ["　送料の割引", -100, true],
    ]);
  });

  // NSS 指定の書式は 10% の取引だけ。8% を 10% の欄に入れた書類を出さない
  it("テストデータのみ：8% の商品がある注文は、書類を出さずにお問い合わせを案内する", () => {
    const view = viewOf(mixedOrder);

    expect(view).toMatchObject({ status: "notice", notice: "contact" });
    const result = customerReceiptFromAccountOrder(mixedOrder, {
      capturedAt: CAPTURED_AT,
      issuer,
      rulesVersion: INVOICE_RULES_VERSION,
      taxConfig: PROVISIONAL_INVOICE_TAX_CONFIG,
      transactionDateBasis: "shippedAt",
      policy: enabledPolicy,
    });
    expect(result).toMatchObject({
      status: "evaluated",
      invoice: { status: "unavailable", reasons: [expect.objectContaining({ code: "statementUnsupportedRate" })] },
    });
  });

  it("集計欄を作れない書類は、帳票でも出さない（10% として描かない）", () => {
    const { invoice } = issuable(viewOf(order1054));

    expect(() => renderToStaticMarkup(createElement(SimplifiedInvoiceSheet, { document: { ...invoice, statement: null } }))).toThrow();
  });

  // 表示の整理で書類の値を変えていない
  it("帳票を描いても、書類の金額・税額・法定記載事項の値は変わらない", () => {
    const view = issuable(viewOf(discountedRope));
    const before = structuredClone(view.invoice);

    renderToStaticMarkup(createElement(SimplifiedInvoiceSheet, { document: view.invoice }));
    expect(view.invoice).toEqual(before);
    expect(view.invoice.taxSummary.rates.map((rate) => [rate.ratePercent, rate.totalIncludingTax, rate.tax])).toEqual([
      [10, 2860, 260],
    ]);
  });
});

function detailHtml(document: Parameters<typeof SimplifiedInvoiceSheet>[0]["document"]) {
  const html = renderToStaticMarkup(createElement(SimplifiedInvoiceSheet, { document }));

  return html.slice(html.indexOf("data-receipt-detail"));
}

/** 明細の表の、各行の金額（右端の列） */
function detailAmounts(document: Parameters<typeof SimplifiedInvoiceSheet>[0]["document"]) {
  return [...detailHtml(document).matchAll(/<tr[^>]*>(?:(?!<\/tr>).)*?<td[^>]*>([−\d,]+)<\/td><\/tr>/g)].map((match) =>
    Number(match[1].replace("−", "-").replace(/,/g, ""))
  );
}

/** 発行の判定の結果と、止めたときの理由のコード */
function invoiceOutcome(input: CustomerAccountInvoiceOrder) {
  const result = customerReceiptFromAccountOrder(input, {
    capturedAt: CAPTURED_AT,
    issuer,
    rulesVersion: INVOICE_RULES_VERSION,
    taxConfig: PROVISIONAL_INVOICE_TAX_CONFIG,
    transactionDateBasis: "shippedAt",
    policy: enabledPolicy,
  });

  if (result.status !== "evaluated") return { status: result.status, codes: result.reasons.map((reason) => reason.code) };
  const { invoice } = result;
  return { status: invoice.status, codes: invoice.status === "unavailable" ? invoice.reasons.map((reason) => reason.code) : [] };
}

/** 販売記録から集計欄の内訳を作る（発行の判定を通さない） */
function breakdownOf(input: CustomerAccountInvoiceOrder) {
  const record = invoiceOrderFromCustomerAccount(input, { capturedAt: CAPTURED_AT, priceBasis: "taxIncluded" });
  const { summary, reasons } = invoiceStatementBreakdown(record.sale, saleTaxBreakdown(record.sale, PROVISIONAL_INVOICE_TAX_CONFIG));

  return {
    columns: summary && [summary.productsExcludingTax, summary.shippingExcludingTax, summary.tax, summary.total],
    codes: reasons.map((reason) => reason.code),
  };
}

// 消費税額は書類 1 枚・税率ごとに 1 回の端数処理（国税庁 タックスアンサー No.6371）。商品と送料の
// 内訳は、Shopify が注文の税額を販売記録ごとに 1 円ずつ割り振った値（Customer Account API の Sale）から作る
describe("集計欄の内訳と Shopify の税額の割り振り", () => {
  it("実データ #1054：送料無料（0 円・税の明細なし）で 16,100・0・1,610・17,710 円", () => {
    expect(breakdownOf(order1054)).toEqual({ columns: [16100, 0, 1610, 17710], codes: [] });
    expect(invoiceOutcome(order1054)).toEqual({ status: "issuable", codes: [] });
  });

  // #1056 は入金前のキャンセルで書類は出ない。販売記録の割り振りだけを確かめる
  it("実データ #1056：送料 700 円に 64 円、商品 550 円に 50 円の割り振りから 500・636・114・1,250 円", () => {
    expect(breakdownOf(order1056)).toEqual({ columns: [500, 636, 114, 1250], codes: [] });
  });

  it("実データ #1057・#1058：商品だけの注文で、Shopify の 1 円の割り振り（2,400 円の行が 219 円）も内訳として作れる", () => {
    expect(breakdownOf(order1057)).toEqual({ columns: [5345, 0, 535, 5880], codes: [] });
    expect(breakdownOf(order1058)).toEqual({ columns: [5245, 0, 525, 5770], codes: [] });
  });

  it("テストデータのみ：2,400 円＋送料 700 円で、送料に 64 円の割り振りなら 2,182・636・282・3,100 円", () => {
    expect(breakdownOf(ropeWithShipping)).toEqual({ columns: [2182, 636, 282, 3100], codes: [] });
    expect(invoiceOutcome(ropeWithShipping)).toEqual({ status: "issuable", codes: [] });
  });

  // 注文の消費税額 282 円は同じ。送料単独で割り戻した 64 円と 1 円違っても、正しい割り振りなので止めない
  it("テストデータのみ：同じ注文で、送料に 63 円・商品に 219 円の割り振りなら 2,181・637・282・3,100 円で発行する", () => {
    const shifted = ropeOrder("#TEST-63", { ropeTax: 219, shipping: 700, shippingTax: 63 });

    expect(breakdownOf(shifted)).toEqual({ columns: [2181, 637, 282, 3100], codes: [] });
    expect(invoiceOutcome(shifted)).toEqual({ status: "issuable", codes: [] });
  });

  it("テストデータのみ：割り振りの合計が注文の消費税額（1 回の端数処理で 282 円）と合わなければ止める", () => {
    const short = ropeOrder("#TEST-281", { ropeTax: 218, shipping: 700, shippingTax: 63 });

    expect(breakdownOf(short).codes).toEqual(["statementAllocationSumMismatch"]);
    expect(invoiceOutcome(short)).toMatchObject({ status: "unavailable" });
    expect(invoiceOutcome(short).codes).toContain("reconcile:mismatch");
  });

  // 合計は 282 円で合っていても、1 円ずつの割り振りでは起きない配分（商品 220 円・送料 62 円）は説明できない
  it("テストデータのみ：合計が合っても、按分の切り捨て〜切り上げを外れる割り振りは止める", () => {
    const skewed = ropeOrder("#TEST-SKEW", { ropeTax: 220, shipping: 700, shippingTax: 62 });

    expect(breakdownOf(skewed).codes).toEqual(["statementAllocationOutOfRange"]);
    expect(invoiceOutcome(skewed)).toEqual({ status: "unavailable", codes: ["statementAllocationOutOfRange"] });
  });

  it("テストデータのみ：送料に課税していない過去の注文（税の明細なし・税額 0 円）は止める", () => {
    const untaxed = ropeOrder("#TEST-UNTAXED", { ropeTax: 218, shipping: 700, shippingTax: null });
    const zeroTax = ropeOrder("#TEST-ZERO", { ropeTax: 218, shipping: 700, shippingTax: 0 });

    expect(invoiceOutcome(untaxed)).toMatchObject({ status: "unavailable", codes: expect.arrayContaining(["untaxedSale"]) });
    expect(invoiceOutcome(zeroTax).status).toBe("unavailable");
    expect(invoiceOutcome(zeroTax).codes).toContain("reconcile:mismatch");
  });

  it("テストデータのみ：送料の割引は割引後の送料で、送料無料（全額割引）は送料 0 円で集計する", () => {
    // 送料 700 円から 100 円引き。3,000 円の税額 273 円 = 商品 218 円＋送料 55 円
    const discounted = ropeOrder("#TEST-SHIPOFF", { ropeTax: 218, shipping: 600, shippingDiscount: 100, shippingTax: 55 });
    const free = ropeOrder("#TEST-SHIPFREE", { ropeTax: 218, shipping: 0, shippingDiscount: 700, shippingTax: 0 });

    expect(breakdownOf(discounted)).toEqual({ columns: [2182, 545, 273, 3000], codes: [] });
    expect(invoiceOutcome(discounted)).toEqual({ status: "issuable", codes: [] });
    expect(breakdownOf(free)).toEqual({ columns: [2182, 0, 218, 2400], codes: [] });
    expect(invoiceOutcome(free)).toEqual({ status: "issuable", codes: [] });
    expect(sheetText(createElement(SimplifiedInvoiceSheet, { document: issuable(viewOf(free)).invoice }))).not.toContain("送料（通常配送）");
  });

  it("テストデータのみ：8% の商品や扱っていない税率がある注文は止める", () => {
    const fivePercent = order({
      name: "#TEST-5",
      agreements: {
        nodes: [
          agreement("gid://shopify/SalesAgreement/1", "ORDER", [
            productSale("gid://shopify/Sale/1", ITEMS.rope, 1, 2400, 114, { taxes: [tax(114, 5)] }),
          ]),
        ],
      },
      transactions: [cardSale(2400)],
      fulfillments: {
        nodes: [fulfillment("gid://shopify/Fulfillment/1", "SUCCESS", "2026-10-05T01:00:00Z", [{ id: ITEMS.rope.id, quantity: 1 }])],
      },
    });

    expect(invoiceOutcome(mixedOrder)).toEqual({ status: "unavailable", codes: ["statementUnsupportedRate"] });
    expect(viewOf(mixedOrder)).toMatchObject({ status: "notice", notice: "contact" });
    expect(invoiceOutcome(fivePercent)).toMatchObject({
      status: "unavailable",
      codes: expect.arrayContaining(["unsupportedTaxRate"]),
    });
  });
});

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
      "返還金額 ¥1,740-",
      "三角自在金具 6個セット 1 1,740",
      "10%対象 1,740 円 158 円",
    ]) {
      expect(text).toContain(expected);
    }
    expect(text).not.toContain("領収");
    expect(invoiceFileName(view.returnInvoices[0], 0)).toBe("適格返還請求書_TEST-1057_1");
  });
});
