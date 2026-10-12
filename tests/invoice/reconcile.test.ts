import { describe, expect, it } from "vitest";

import { PROVISIONAL_INVOICE_TAX_CONFIG } from "@/lib/invoice/config";
import { yen } from "@/lib/invoice/money";
import type { InvoiceOrderRecord, InvoiceOrderSale, ShopifyAmounts } from "@/lib/invoice/order";
import { reconcileAmounts, reconcileOrder } from "@/lib/invoice/reconcile";
import { taxBreakdown } from "@/lib/invoice/tax";

import { line, lineRefund, orderRecord, shipping } from "./fixtures";

const config = PROVISIONAL_INVOICE_TAX_CONFIG;

function amounts(rates: [ratePercent: number, amount: number, tax: number][]): ShopifyAmounts {
  return {
    total: yen(rates.reduce((sum, [, amount]) => sum + amount, 0)),
    tax: yen(rates.reduce((sum, [, , tax]) => sum + tax, 0)),
    rates: rates.map(([ratePercent, amount, tax]) => ({ ratePercent, amount: yen(amount), tax: yen(tax) })),
  };
}

function withSale(sale: Partial<InvoiceOrderSale>): InvoiceOrderRecord {
  const record = orderRecord();
  return { ...record, sale: { ...record.sale, ...sale } };
}

/** Shopify の実際の注文の、注文時の販売記録の税率ごとの合計（Customer Account API で取得） */
describe("実際の Shopify の注文の値", () => {
  const cases: [string, InvoiceOrderSale["lines"], InvoiceOrderSale["shipping"], number, number][] = [
    ["#1057", [line("rope", 1740, 2), line("rope-long", 2400, 1)], null, 5880, 535],
    ["#1058", [line("peg", 550, 1), line("rope", 1740, 3)], null, 5770, 525],
    ["#1056", [line("peg", 550, 1)], shipping(700), 1250, 114],
    ["#1054", [line("ground-sheet", 17710, 1)], null, 17710, 1610],
  ];

  for (const [name, lines, shippingFee, total, tax] of cases) {
    it(`${name}：合計 ${total} 円・税額 ${tax} 円が一致する`, () => {
      const result = reconcileOrder(
        withSale({ lines, shipping: shippingFee, shopifyReference: amounts([[10, total, tax]]) }),
        config
      );

      expect(result.sale).toEqual({ status: "match", findings: [] });
    });
  }

  it("送料無料の 0 円・0 円の税率の欄は比べない（#1058 の送料は 10%・0 円）", () => {
    const result = reconcileOrder(
      withSale({
        lines: [line("peg", 550, 1), line("rope", 1740, 3)],
        shopifyReference: amounts([[10, 5770, 525], [8, 0, 0]]),
      }),
      config
    );

    expect(result.sale.status).toBe("match");
  });
});

/** ここから下はテストデータのみ（Shopify API 未検証） */
describe("テストデータのみ：不一致・データ不足", () => {
  it("送料に課税していなかった時期の注文（3,100 円で税額 218 円）は不一致", () => {
    const result = reconcileOrder(
      withSale({ lines: [line("rope-long", 2400, 1)], shipping: shipping(700), shopifyReference: amounts([[10, 3100, 218]]) }),
      config
    );

    expect(result.sale.status).toBe("mismatch");
    expect(result.sale.findings).toEqual([
      { field: "tax", ratePercent: null, expected: 282, actual: 218 },
      { field: "rateTax", ratePercent: 10, expected: 282, actual: 218 },
    ]);
  });

  it("行ごとに丸めた税額（534 円）は、1 円でも不一致にする", () => {
    const result = reconcileOrder(withSale({ shopifyReference: amounts([[10, 5880, 534]]) }), config);

    expect(result.sale.status).toBe("mismatch");
  });

  it("税率ごとの内訳が違えば、合計が同じでも不一致", () => {
    const ours = taxBreakdown(
      [
        { amount: yen(1100), ratePercent: 10 },
        { amount: yen(1080), ratePercent: 8 },
      ],
      config
    );

    expect(reconcileAmounts(ours, amounts([[10, 1100, 100], [8, 1080, 80]])).status).toBe("match");
    expect(reconcileAmounts(ours, amounts([[10, 2180, 180]])).findings.map((finding) => [finding.field, finding.ratePercent])).toEqual([
      ["rateAmount", 10],
      ["rateTax", 10],
      ["rateAmount", 8],
      ["rateTax", 8],
    ]);
  });

  it("扱っていない税率が Shopify にあれば不一致", () => {
    const ours = taxBreakdown([{ amount: yen(1100), ratePercent: 10 }], config);

    expect(reconcileAmounts(ours, amounts([[10, 1100, 100], [5, 0, 1]])).status).toBe("mismatch");
  });

  it("Shopify の販売記録が取れていなければデータ不足", () => {
    const result = reconcileOrder(withSale({ shopifyReference: null }), config);

    expect(result.sale).toEqual({ status: "dataMissing", findings: [] });
  });

  it("返金は返金ごとに、返金の販売記録と照合する", () => {
    const record = orderRecord({
      refunds: [
        lineRefund("refund-1", "rope", 1, 1740, 1740, { shopifyReference: amounts([[10, 1740, 158]]) }),
        // Shopify は注文全体の税額を行に割り振るので、2,400 円の行の返金が 219 円になりうる
        lineRefund("refund-2", "rope-long", 1, 2400, 2400, { shopifyReference: amounts([[10, 2400, 219]]) }),
        lineRefund("refund-3", "rope-long", 1, 2400),
      ],
    });
    const result = reconcileOrder(record, config);

    expect(result.refunds["refund-1"].status).toBe("match");
    expect(result.refunds["refund-2"]).toMatchObject({
      status: "mismatch",
      findings: [
        { field: "tax", expected: 218, actual: 219 },
        { field: "rateTax", ratePercent: 10, expected: 218, actual: 219 },
      ],
    });
    expect(result.refunds["refund-3"].status).toBe("dataMissing");
  });
});
