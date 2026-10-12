/**
 * 利用明細書・適格請求書で扱う金額。
 *
 * 円は小数を持たないので、金額はすべて整数の円で持つ。Shopify は "1250.0"
 * のような文字列で返すので、読み込むときに整数かどうかを確かめ、小数の
 * 足し算をしない。円以外の通貨は扱わない（混ざっていたら読み込みで止める）。
 */

export const INVOICE_CURRENCY = "JPY";

/** 整数の円。`yen()` か `parseShopifyYen()` を通したものだけを入れる */
export type Yen = number & { readonly __yen: unique symbol };

export class InvoiceMoneyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvoiceMoneyError";
  }
}

export function yen(value: number): Yen {
  if (!Number.isSafeInteger(value)) {
    throw new InvoiceMoneyError(`円の金額は整数で扱います: ${value}`);
  }

  return value as Yen;
}

export const ZERO_YEN = yen(0);

/**
 * Shopify の金額（`{ amount: "1250.0", currencyCode: "JPY" }`）を整数の円にする。
 * 1 円未満の端数がある、または円以外の通貨なら止める。
 */
export function parseShopifyYen(money: { amount: string; currencyCode?: string | null }) {
  if (money.currencyCode && money.currencyCode !== INVOICE_CURRENCY) {
    throw new InvoiceMoneyError(`円以外の通貨は扱いません: ${money.currencyCode}`);
  }

  const text = money.amount.trim();

  if (!/^-?\d+(\.0+)?$/.test(text)) {
    throw new InvoiceMoneyError(`円の金額として読めません: ${money.amount}`);
  }

  return yen(Number.parseInt(text, 10));
}

export function sumYen(values: readonly Yen[]): Yen {
  return yen(values.reduce((sum, value) => sum + value, 0));
}

export function addYen(a: Yen, b: Yen): Yen {
  return yen(a + b);
}

export function subtractYen(a: Yen, b: Yen): Yen {
  return yen(a - b);
}

export function multiplyYen(a: Yen, quantity: number): Yen {
  if (!Number.isSafeInteger(quantity)) {
    throw new InvoiceMoneyError(`数量は整数で扱います: ${quantity}`);
  }

  return yen(a * quantity);
}
