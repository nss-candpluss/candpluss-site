import { describe, expect, it } from "vitest";

import { PROVISIONAL_INVOICE_TAX_CONFIG } from "@/lib/invoice/config";
import { InvoiceMoneyError, parseShopifyYen, yen } from "@/lib/invoice/money";
import {
  orderLineAmount,
  refundTaxBreakdown,
  saleTaxBreakdown,
  shippingAmount,
  type InvoiceOrderLine,
  type InvoiceOrderSale,
  type InvoiceRefund,
  type InvoiceShipping,
} from "@/lib/invoice/order";
import {
  consumptionTax,
  roundRatio,
  taxBreakdown,
  taxRatePercent,
  type InvoiceTaxConfig,
} from "@/lib/invoice/tax";

import { line, shipping } from "./fixtures";

const config = PROVISIONAL_INVOICE_TAX_CONFIG;

function sale(lines: InvoiceOrderLine[], shippingFee: InvoiceShipping | null = null): InvoiceOrderSale {
  return {
    orderId: "gid://shopify/Order/test",
    orderName: "#TEST",
    priceBasis: "taxIncluded",
    processedAt: "2026-10-10T00:00:00Z",
    lines,
    shipping: shippingFee,
    shopifyReference: null,
  };
}

function refund(overrides: Partial<InvoiceRefund>): InvoiceRefund {
  return {
    refundId: "gid://shopify/Refund/test",
    createdAt: "2026-10-11T00:00:00Z",
    lines: [],
    shipping: [],
    adjustments: [],
    refundedAmount: null,
    shopifyReference: null,
    ...overrides,
  };
}

const refundLine = (lineId: string, amount: number, ratePercent: 10 | 8 = 10) => ({
  lineId,
  quantity: 1,
  amount: yen(amount),
  ratePercent,
});

describe("金額の読み込み", () => {
  it("Shopify の金額文字列を整数の円にする", () => {
    expect(parseShopifyYen({ amount: "1250.0", currencyCode: "JPY" })).toBe(1250);
    expect(parseShopifyYen({ amount: "5880" })).toBe(5880);
    expect(parseShopifyYen({ amount: "-700.00", currencyCode: "JPY" })).toBe(-700);
  });

  it("1 円未満の端数・読めない値・円以外の通貨は止める", () => {
    expect(() => parseShopifyYen({ amount: "0.1" })).toThrow(InvoiceMoneyError);
    expect(() => parseShopifyYen({ amount: "1,250" })).toThrow(InvoiceMoneyError);
    expect(() => parseShopifyYen({ amount: "" })).toThrow(InvoiceMoneyError);
    expect(() => parseShopifyYen({ amount: "10.00", currencyCode: "USD" })).toThrow(
      InvoiceMoneyError
    );
    expect(() => yen(0.5)).toThrow(InvoiceMoneyError);
  });
});

describe("端数処理", () => {
  it("分子・分母の整数から丸め、小数を経由しない", () => {
    // 105 × 10 / 100 = 10.5（税抜価格のときに 0.5 円が出る）
    expect(roundRatio(1050, 100, "floor")).toBe(10);
    expect(roundRatio(1050, 100, "ceil")).toBe(11);
    expect(roundRatio(1050, 100, "halfUp")).toBe(11);
    expect(roundRatio(1050, 100, "halfEven")).toBe(10);
    // 115 × 10 / 100 = 11.5
    expect(roundRatio(1150, 100, "halfEven")).toBe(12);
  });

  it("負の金額は絶対値で丸めて符号を戻す", () => {
    expect(roundRatio(-1050, 100, "halfUp")).toBe(-11);
    expect(roundRatio(-1050, 100, "floor")).toBe(-10);
  });

  it("税込価格を 10% / 8% で割り戻すと、端数がちょうど 0.5 円になることはない", () => {
    const exactHalves: string[] = [];

    for (let amount = 1; amount <= 200000; amount += 1) {
      for (const rate of [10, 8]) {
        if (((amount * rate) % (100 + rate)) * 2 === 100 + rate) {
          exactHalves.push(`${amount}@${rate}`);
        }
      }
    }

    expect(exactHalves).toEqual([]);
  });

  it("多くの行を足しても、整数のまま誤差なく集計する", () => {
    const items = Array.from({ length: 1000 }, () => ({ amount: yen(110), ratePercent: 10 as const }));
    expect(taxBreakdown(items, config).tax).toBe(10000);
  });
});

/**
 * Shopify の実際の注文・チェックアウトで確かめた税額。
 * 商品も送料も税込・課税、注文 1 件につき税率ごとに 1 回丸めている。
 */
describe("回帰：Shopify で確かめた税額", () => {
  it("#1057：1,740 円 ×2 ＋ 2,400 円 ＝ 5,880 円 → 535 円", () => {
    const result = saleTaxBreakdown(
      sale([line("ガイロープ", 1740, 2), line("ガイロープ長", 2400, 1)]),
      config
    );

    expect(result.total).toBe(5880);
    expect(result.tax).toBe(535);
    expect(result.rates).toEqual([
      { ratePercent: 10, totalIncludingTax: 5880, totalExcludingTax: 5345, tax: 535 },
    ]);
  });

  it("#1057：行ごとに丸めて足すと 534 円になり、Shopify と合わない", () => {
    const perLine =
      consumptionTax(yen(3480), 10, config) + consumptionTax(yen(2400), 10, config);
    expect(perLine).toBe(534);
  });

  it("#1058：550 円 ＋ 1,740 円 ×3 ＝ 5,770 円 → 525 円", () => {
    const result = saleTaxBreakdown(
      sale([line("ペグ", 550, 1), line("ガイロープ", 1740, 3)]),
      config
    );

    expect(result.total).toBe(5770);
    expect(result.tax).toBe(525);
  });

  it("#1058：1 個ずつ丸めて足すと 524 円になり、Shopify と合わない", () => {
    const perUnit =
      consumptionTax(yen(550), 10, config) + consumptionTax(yen(1740), 10, config) * 3;
    expect(perUnit).toBe(524);
  });

  it("チェックアウト：商品 2,400 円 ＋ 送料 700 円 ＝ 3,100 円 → 282 円", () => {
    const result = saleTaxBreakdown(sale([line("ガイロープ", 2400, 1)], shipping(700)), config);

    expect(result.total).toBe(3100);
    expect(result.tax).toBe(282);
    expect(result.rates[0]?.totalExcludingTax).toBe(2818);
  });

  it("#1056：商品 550 円 ＋ 送料 700 円 ＝ 1,250 円 → 114 円", () => {
    const result = saleTaxBreakdown(sale([line("ペグ", 550, 1)], shipping(700)), config);

    expect(result.total).toBe(1250);
    expect(result.tax).toBe(114);
  });

  it("#1054：17,710 円（送料無料）→ 1,610 円（割り切れる金額）", () => {
    const result = saleTaxBreakdown(sale([line("グランドシート", 17710, 1)]), config);

    expect(result.total).toBe(17710);
    expect(result.tax).toBe(1610);
    expect(result.rates[0]?.totalExcludingTax).toBe(16100);
  });

  it("送料に課税していなかった時期の注文：商品 2,400 円 → 218 円（切り上げなら 219 円）", () => {
    expect(consumptionTax(yen(2400), 10, config)).toBe(218);
    expect(consumptionTax(yen(2400), 10, { ...config, rounding: "ceil" })).toBe(219);
    // 5,880 円は切り捨てだと 534 円になり、Shopify の 535 円と合わない
    expect(consumptionTax(yen(5880), 10, { ...config, rounding: "floor" })).toBe(534);
  });

  it("既存の明細書の計算（data/receipt.ts）と同じ結果になる", async () => {
    const { receiptSummaryAmounts } = await import("@/data/receipt");

    for (const [total, shippingFee] of [
      [5880, 0],
      [5770, 0],
      [3100, 700],
      [1250, 700],
    ]) {
      const amounts = receiptSummaryAmounts({ total, shipping: shippingFee });
      const result = taxBreakdown([{ amount: yen(total), ratePercent: 10 }], config);
      expect(result.tax).toBe(amounts.tax);
    }
  });
});

/**
 * ここから下はテストデータだけで確かめたもの。
 * Shopify の実際の API・注文の値とはまだ照合していない。
 */
describe("テストデータのみ（Shopify API 未検証）：割引", () => {
  it("商品の割引は、割引後の金額から税額を出す", () => {
    const discounted = line("ガイロープ長", 2400, 1, { discount: yen(240) });

    expect(orderLineAmount(discounted)).toBe(2160);
    const result = saleTaxBreakdown(sale([discounted], shipping(700)), config);
    // 2,160 + 700 = 2,860 → 260
    expect(result.total).toBe(2860);
    expect(result.tax).toBe(260);
  });

  it("割引の前後で税額が変わる（割引前の税額をそのまま使わない）", () => {
    const before = saleTaxBreakdown(sale([line("A", 2400, 1)]), config);
    const after = saleTaxBreakdown(sale([line("A", 2400, 1, { discount: yen(500) })]), config);

    expect(before.tax).toBe(218);
    expect(after.total).toBe(1900);
    expect(after.tax).toBe(173);
  });

  it("送料の割引（送料無料）は、送料の課税対象から引く", () => {
    const result = saleTaxBreakdown(
      sale([line("A", 2400, 1)], shipping(700, { discount: yen(700) })),
      config
    );

    expect(result.total).toBe(2400);
    expect(result.tax).toBe(218);
  });

  it("割引が金額を超えるデータ・負の割引は止める（0 円に補正しない）", () => {
    expect(() => orderLineAmount(line("A", 500, 1, { discount: yen(600) }))).toThrow(InvoiceMoneyError);
    expect(() => orderLineAmount(line("A", 500, 1, { discount: yen(-100) }))).toThrow(InvoiceMoneyError);
    expect(() => shippingAmount(shipping(700, { discount: yen(800) }))).toThrow(InvoiceMoneyError);
  });
});

describe("テストデータのみ（Shopify API 未検証）：税率", () => {
  it("8% の商品は 8% で割り戻す", () => {
    const result = saleTaxBreakdown(sale([line("食品", 1080, 1, { ratePercent: 8 })]), config);

    expect(result.rates).toEqual([
      { ratePercent: 8, totalIncludingTax: 1080, totalExcludingTax: 1000, tax: 80 },
    ]);
  });

  it("10% と 8% が混ざると、税率ごとに分けて 1 回ずつ丸める", () => {
    const result = saleTaxBreakdown(
      sale(
        [
          line("ガイロープ", 1740, 1),
          line("食品A", 540, 1, { ratePercent: 8 }),
          line("食品B", 1001, 1, { ratePercent: 8 }),
        ],
        shipping(700)
      ),
      config
    );

    // 10%：1,740 + 700 = 2,440 → 221.8 → 222
    // 8%：540 + 1,001 = 1,541 → 114.1 → 114
    expect(result.rates).toEqual([
      { ratePercent: 10, totalIncludingTax: 2440, totalExcludingTax: 2218, tax: 222 },
      { ratePercent: 8, totalIncludingTax: 1541, totalExcludingTax: 1427, tax: 114 },
    ]);
    expect(result.total).toBe(3981);
    expect(result.tax).toBe(336);
  });

  it("税率を混ぜて 1 回で割り戻した額とは一致しない", () => {
    // 3,981 を全部 10% として割り戻すと 362 になる
    expect(consumptionTax(yen(3981), 10, config)).toBe(362);
  });

  it("扱っていない税率（非課税の 0%・5% など）は止め、10% として扱わない", () => {
    expect(taxRatePercent(10)).toBe(10);
    expect(taxRatePercent(8)).toBe(8);
    expect(() => taxRatePercent(5)).toThrow(InvoiceMoneyError);
    expect(() => taxRatePercent(0)).toThrow(InvoiceMoneyError);
  });

  it("税抜価格の設定では、税抜の合計に税率を掛けて丸める", () => {
    const exclusive: InvoiceTaxConfig = { priceBasis: "taxExcluded", rounding: "halfUp" };
    const result = taxBreakdown([{ amount: yen(105), ratePercent: 10 }], exclusive);

    expect(result.rates).toEqual([
      { ratePercent: 10, totalIncludingTax: 116, totalExcludingTax: 105, tax: 11 },
    ]);
    expect(
      taxBreakdown([{ amount: yen(105), ratePercent: 10 }], { ...exclusive, rounding: "halfEven" }).tax
    ).toBe(10);
  });
});

/**
 * 送料の税率は商品とは独立。別途請求する送料は、商品が軽減税率 8% でも
 * 原則 10%（軽減税率 Q&A 個別事例編 問39）。
 */
describe("テストデータのみ（Shopify API 未検証）：送料の税率", () => {
  const food = (price: number) => line("食品", price, 1, { ratePercent: 8 });

  it("商品 10%・送料 10%（今の C AND+S）は 1 つの税率にまとまる", () => {
    const result = saleTaxBreakdown(sale([line("ガイロープ", 2400, 1)], shipping(700)), config);

    expect(result.rates).toEqual([
      { ratePercent: 10, totalIncludingTax: 3100, totalExcludingTax: 2818, tax: 282 },
    ]);
  });

  it("商品 8%・送料 10% は、送料を 10% の欄に入れる", () => {
    const result = saleTaxBreakdown(sale([food(1080)], shipping(700)), config);

    expect(result.rates).toEqual([
      { ratePercent: 10, totalIncludingTax: 700, totalExcludingTax: 636, tax: 64 },
      { ratePercent: 8, totalIncludingTax: 1080, totalExcludingTax: 1000, tax: 80 },
    ]);
    expect(result.total).toBe(1780);
  });

  it("商品 8% と 10% の混在・送料 10%", () => {
    const result = saleTaxBreakdown(sale([line("ガイロープ", 1740, 1), food(1080)], shipping(700)), config);

    expect(result.rates).toEqual([
      { ratePercent: 10, totalIncludingTax: 2440, totalExcludingTax: 2218, tax: 222 },
      { ratePercent: 8, totalIncludingTax: 1080, totalExcludingTax: 1000, tax: 80 },
    ]);
  });

  it("送料無料（送料の全額割引）では、10% の欄を作らない", () => {
    const result = saleTaxBreakdown(sale([food(1080)], shipping(700, { discount: yen(700) })), config);

    expect(result.rates.map((rate) => rate.ratePercent)).toEqual([8]);
    expect(result.total).toBe(1080);
  });

  it("送料の一部割引は、割引後の送料を 10% で計算する", () => {
    const result = saleTaxBreakdown(sale([food(1080)], shipping(700, { discount: yen(200) })), config);

    // 500 × 10 / 110 = 45.45 → 45
    expect(result.rates[0]).toEqual({
      ratePercent: 10,
      totalIncludingTax: 500,
      totalExcludingTax: 455,
      tax: 45,
    });
  });

  it("8% の商品の注文で送料だけを返金すると、返金は 10% だけになる", () => {
    const result = refundTaxBreakdown(refund({ shipping: [{ amount: yen(700), ratePercent: 10 }] }), config);

    expect(result.rates).toEqual([
      { ratePercent: 10, totalIncludingTax: 700, totalExcludingTax: 636, tax: 64 },
    ]);
  });
});

describe("テストデータのみ（Shopify API 未検証）：返金", () => {
  it("返金は当初の注文とは別に集計し、当初の内容を変えない", () => {
    const original = sale([line("ガイロープ", 1740, 2), line("ガイロープ長", 2400, 1)]);
    const before = saleTaxBreakdown(original, config);

    const returned = refundTaxBreakdown(refund({ lines: [refundLine("ガイロープ", 1740)] }), config);

    expect(returned.total).toBe(1740);
    expect(returned.tax).toBe(158);
    expect(saleTaxBreakdown(original, config)).toEqual(before);
    expect(before.tax).toBe(535);
  });

  it("送料の返金は、送料の税率で集計する", () => {
    const result = refundTaxBreakdown(refund({ shipping: [{ amount: yen(700), ratePercent: 10 }] }), config);

    expect(result.total).toBe(700);
    expect(result.tax).toBe(64);
  });

  it("商品と送料をまとめて返金すると、返金 1 件の中で税率ごとに 1 回丸める", () => {
    const result = refundTaxBreakdown(
      refund({ lines: [refundLine("ペグ", 550)], shipping: [{ amount: yen(700), ratePercent: 10 }] }),
      config
    );

    // 550 → 50、700 → 64 を足すと 114。まとめて 1,250 → 113.6 → 114
    expect(result.tax).toBe(114);
  });

  it("当初の税額から返金の税額を引いた額と、返金後の金額で計算し直した税額は一致しないことがある", () => {
    const original = saleTaxBreakdown(
      sale([line("ガイロープ", 1740, 2), line("ガイロープ長", 2400, 1)]),
      config
    );
    const returned = refundTaxBreakdown(refund({ lines: [refundLine("ガイロープ", 1740)] }), config);
    const remaining = taxBreakdown([{ amount: yen(5880 - 1740), ratePercent: 10 }], config);

    // 535 − 158 = 377、4,140 で計算し直すと 376
    expect(original.tax - returned.tax).toBe(377);
    expect(remaining.tax).toBe(376);
  });

  it("8% と 10% を混ぜた返金は、税率ごとに分ける", () => {
    const result = refundTaxBreakdown(
      refund({
        lines: [refundLine("A", 1100), refundLine("B", 1080, 8)],
        adjustments: [{ description: "返金の調整", amount: yen(330), ratePercent: 10 }],
      }),
      config
    );

    expect(result.rates.map((rate) => [rate.ratePercent, rate.tax])).toEqual([
      [10, 130],
      [8, 80],
    ]);
    expect(result.total).toBe(2510);
  });

  it("負の返金額は止める（符号を補正しない）", () => {
    expect(() => refundTaxBreakdown(refund({ lines: [refundLine("A", -100)] }), config)).toThrow(
      InvoiceMoneyError
    );
  });
});
