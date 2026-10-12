import {
  InvoiceMoneyError,
  sumYen,
  subtractYen,
  yen,
  type Yen,
} from "@/lib/invoice/money";

/**
 * 扱える税率。C AND+S の商品と送料は今は標準税率 10% だけで、軽減税率 8% の商品を
 * 扱いはじめたときのために 8% も計算できるようにしている。
 *
 * 非課税・免税・不課税の取引は扱っていない。そうした行が Shopify のデータにあれば、
 * 10% の取引として扱わず、変換の段階で発行を止める（`customer-account-order.ts`）。
 */
export const TAX_RATE_PERCENTS = [10, 8] as const;
export type TaxRatePercent = (typeof TAX_RATE_PERCENTS)[number];

export function taxRatePercent(value: number): TaxRatePercent {
  if (!TAX_RATE_PERCENTS.includes(value as TaxRatePercent)) {
    throw new InvoiceMoneyError(`扱っていない税率です: ${value}%`);
  }

  return value as TaxRatePercent;
}

export function isReducedRate(ratePercent: TaxRatePercent) {
  return ratePercent === 8;
}

/**
 * 1 円未満の端数の処理。
 *
 * 国税庁の Q&A（問57）では、端数処理は適格請求書 1 枚につき税率ごとに 1 回で、
 * 切り上げ・切り捨て・四捨五入のどれでもよい。どれを使うかは設定で決める。
 */
export type TaxRoundingMode = "floor" | "ceil" | "halfUp" | "halfEven";

/** 価格に税を含めているか。Shopify の「商品価格と配送料に売上税を含める」に合わせる */
export type PriceBasis = "taxIncluded" | "taxExcluded";

export type InvoiceTaxConfig = {
  priceBasis: PriceBasis;
  rounding: TaxRoundingMode;
};

/**
 * 割り算の結果を、指定の方法で整数にする。分子・分母とも整数で受け取り、
 * 小数を経由しない。負の金額（返金など）は絶対値で丸めて符号を戻す。
 */
export function roundRatio(
  numerator: number,
  denominator: number,
  mode: TaxRoundingMode
): number {
  if (
    !Number.isSafeInteger(numerator) ||
    !Number.isSafeInteger(denominator) ||
    denominator <= 0
  ) {
    throw new InvoiceMoneyError(`端数処理できない値です: ${numerator}/${denominator}`);
  }

  const sign = numerator < 0 ? -1 : 1;
  const absolute = Math.abs(numerator);
  const quotient = Math.floor(absolute / denominator);
  const remainder = absolute - quotient * denominator;
  const twice = remainder * 2;

  let rounded = quotient;

  switch (mode) {
    case "floor":
      break;
    case "ceil":
      rounded = remainder > 0 ? quotient + 1 : quotient;
      break;
    case "halfUp":
      rounded = twice >= denominator ? quotient + 1 : quotient;
      break;
    case "halfEven":
      rounded =
        twice > denominator || (twice === denominator && quotient % 2 === 1)
          ? quotient + 1
          : quotient;
      break;
  }

  return sign * rounded;
}

/**
 * 金額に対する消費税額。
 *
 * 税込価格なら「金額 × 税率 ÷ (100 + 税率)」、税抜価格なら「金額 × 税率 ÷ 100」を、
 * 指定の方法で 1 回だけ丸める。
 */
export function consumptionTax(
  amount: Yen,
  ratePercent: TaxRatePercent,
  config: InvoiceTaxConfig
): Yen {
  const denominator =
    config.priceBasis === "taxIncluded" ? 100 + ratePercent : 100;

  return yen(roundRatio(amount * ratePercent, denominator, config.rounding));
}

/** 税率ごとの集計に入れる 1 件。商品・送料・返金の行のどれでもよい */
export type TaxableAmount = {
  /** 割引を引いた後の金額。税込価格なら税込、税抜価格なら税抜 */
  amount: Yen;
  ratePercent: TaxRatePercent;
};

/** 税率ごとの課税対象額と消費税額。適格請求書の「税率ごとに区分した合計額と消費税額」 */
export type TaxRateTotal = {
  ratePercent: TaxRatePercent;
  /** 税込の対価の額 */
  totalIncludingTax: Yen;
  /** 税抜の対価の額 */
  totalExcludingTax: Yen;
  tax: Yen;
};

export type TaxBreakdown = {
  /** 税率の高い順 */
  rates: TaxRateTotal[];
  /** 請求の合計（税込） */
  total: Yen;
  tax: Yen;
};

/**
 * 1 枚の書類（適格簡易請求書・適格返還請求書）の、税率ごとの集計。
 *
 * 行ごとに税額を丸めて足すのではなく、税率ごとに金額を足してから 1 回だけ
 * 丸める（国税庁 Q&A 問57）。Shopify の注文 #1057（1,740 円×2 ＋ 2,400 円）は
 * この方法で 535 円になり、行ごとに丸めると 534 円になる。
 */
export function taxBreakdown(
  items: readonly TaxableAmount[],
  config: InvoiceTaxConfig
): TaxBreakdown {
  const byRate = new Map<TaxRatePercent, Yen[]>();

  for (const item of items) {
    // 送料無料などの 0 円の行で、取引の無い税率の欄を作らない
    if (item.amount === 0) {
      continue;
    }
    const list = byRate.get(item.ratePercent) ?? [];
    list.push(item.amount);
    byRate.set(item.ratePercent, list);
  }

  const rates = [...byRate.entries()]
    .sort(([a], [b]) => b - a)
    .map(([ratePercent, amounts]): TaxRateTotal => {
      const amount = sumYen(amounts);
      const tax = consumptionTax(amount, ratePercent, config);

      return config.priceBasis === "taxIncluded"
        ? {
            ratePercent,
            totalIncludingTax: amount,
            totalExcludingTax: subtractYen(amount, tax),
            tax,
          }
        : {
            ratePercent,
            totalIncludingTax: yen(amount + tax),
            totalExcludingTax: amount,
            tax,
          };
    });

  return {
    rates,
    total: sumYen(rates.map((rate) => rate.totalIncludingTax)),
    tax: sumYen(rates.map((rate) => rate.tax)),
  };
}
