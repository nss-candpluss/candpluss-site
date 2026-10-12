import { receiptLineDescription } from "@/data/receipt";
import {
  InvoiceMoneyError,
  INVOICE_CURRENCY,
  parseShopifyYen,
  yen,
  type Yen,
} from "@/lib/invoice/money";
import {
  issueReason,
  type InvoiceFulfillment,
  type InvoiceIssueReason,
  type InvoiceOrderLine,
  type InvoiceOrderRecord,
  type InvoicePaymentTransaction,
  type InvoiceRefund,
  type InvoiceShipping,
  type ShopifyAmounts,
} from "@/lib/invoice/order";
import { TAX_RATE_PERCENTS, type PriceBasis, type TaxRatePercent } from "@/lib/invoice/tax";

/**
 * Customer Account API の注文から、書類の元にする注文のデータ（`InvoiceOrderRecord`）を作る。
 *
 * ご注文内容と税額は、注文時の販売記録（`agreements` の `OrderAgreement`）から作る。
 * 注文の合計（`totalPrice`・`totalTax`・`totalShipping`）や商品行の今の金額は、キャンセル・
 * 返金の後に変わり、キャンセル後の送料合計のように食い違うこともあるので使わない。
 *
 * 返金は返金の販売記録（`RefundAgreement`）から返金ごとに作る。入金前のキャンセルでも
 * 返金の販売記録は作られるので、お金を返したかどうかは `Order.refunds` と決済の記録で見る。
 *
 * 自動では扱わない事柄（注文編集・返品の記録・扱っていない税率・送料の非課税・ギフトカード
 * など）は推測で埋めず、`dataIssues`（ご注文内容・お支払い）か `refundIssues`（返金）に
 * 残して発行を止める。返金の側の事柄は、返還請求書だけを止める。
 *
 * 2026-10 の版で、#1054・#1056・#1057・#1058 の実際の注文の値を確かめた。割引・8% の商品・
 * お金の返金・注文編集の値は、実際のデータではまだ確かめていない。
 */

type Money = { amount: string; currencyCode?: string | null };

type PageInfo = { hasNextPage: boolean };

export type CustomerAccountSaleTax = {
  amount: Money;
  taxLine: { ratePercentage: number | null; channelLiable: boolean };
};

export type CustomerAccountSale = {
  __typename: string;
  id: string;
  actionType: string;
  lineType: string;
  quantity: number | null;
  totalAmount: Money;
  totalTaxAmount: Money;
  totalDiscountAmountAfterTaxes: Money;
  taxes: CustomerAccountSaleTax[];
  lineItem?: { id: string; name: string; variantTitle?: string | null; price?: Money | null } | null;
};

export type CustomerAccountAgreement = {
  __typename: string;
  id: string;
  happenedAt: string;
  reason: string;
  refund?: { id: string } | null;
  sales: { pageInfo?: PageInfo; nodes: CustomerAccountSale[] };
};

export type CustomerAccountInvoiceOrder = {
  id: string;
  name: string;
  processedAt: string;
  currencyCode?: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  edited: boolean;
  financialStatus: string | null;
  totalRefunded: Money;
  shippingLine: { title: string } | null;
  agreements: { pageInfo?: PageInfo; nodes: CustomerAccountAgreement[] };
  refunds: { id: string; createdAt: string | null; totalRefunded: Money }[];
  transactions: {
    id: string;
    kind: string | null;
    status: string | null;
    type: string;
    createdAt: string;
    processedAt: string | null;
    transactionParentId: string | null;
    transactionAmount: { presentmentMoney: Money };
  }[];
  fulfillments: {
    pageInfo?: PageInfo;
    nodes: {
      id: string;
      status: string;
      createdAt: string;
      fulfillmentLineItems: { pageInfo?: PageInfo; nodes: { quantity: number; lineItem: { id: string } }[] };
    }[];
  };
};

const MONEY = "{ amount currencyCode }";

/**
 * 書類に使う項目だけを読む、Customer Account API（`Order`）の項目。
 * 住所・氏名・連絡先・カード情報は読まない。
 */
export const INVOICE_ORDER_FIELDS = `
  id name processedAt currencyCode cancelledAt cancelReason edited financialStatus
  totalRefunded ${MONEY}
  shippingLine { title }
  agreements(first: 20) {
    pageInfo { hasNextPage }
    nodes {
      __typename id happenedAt reason
      ... on RefundAgreement { refund { id } }
      sales(first: 50) {
        pageInfo { hasNextPage }
        nodes {
          __typename id actionType lineType quantity
          totalAmount ${MONEY} totalTaxAmount ${MONEY}
          totalDiscountAmountAfterTaxes ${MONEY}
          taxes { amount ${MONEY} taxLine { ratePercentage channelLiable } }
          ... on ProductSale { lineItem { id name variantTitle price ${MONEY} } }
        }
      }
    }
  }
  refunds { id createdAt totalRefunded ${MONEY} }
  transactions {
    id kind status type createdAt processedAt transactionParentId
    transactionAmount { presentmentMoney ${MONEY} }
  }
  fulfillments(first: 10) {
    pageInfo { hasNextPage }
    nodes {
      id status createdAt
      fulfillmentLineItems(first: 50) { pageInfo { hasNextPage } nodes { quantity lineItem { id } } }
    }
  }`;

const MANUAL_PAYMENT_TYPES = new Set(["BANK_DEPOSIT", "CASH_ON_DELIVERY", "CUSTOM", "MANUAL", "MONEY_ORDER"]);
/** 今の販売で扱っていない支払い方法。税務上の扱いを確かめていないので発行を止める */
const UNSUPPORTED_PAYMENT_TYPES = new Set(["GIFT_CARD", "STORE_CREDIT"]);

const TRANSACTION_KINDS: Record<string, InvoicePaymentTransaction["kind"]> = {
  SALE: "sale",
  CAPTURE: "capture",
  AUTHORIZATION: "authorization",
  REFUND: "refund",
  VOID: "void",
};

const TRANSACTION_STATUSES: Record<string, InvoicePaymentTransaction["status"]> = {
  SUCCESS: "success",
  PENDING: "pending",
  FAILURE: "failure",
  ERROR: "failure",
};

const FULFILLMENT_STATUSES: Record<string, InvoiceFulfillment["status"]> = {
  SUCCESS: "success",
  OPEN: "pending",
  PENDING: "pending",
  CANCELLED: "cancelled",
  FAILURE: "failure",
  ERROR: "failure",
};

type Issues = {
  push(code: string, message: string): void;
  list: InvoiceIssueReason[];
};

function issueList(): Issues {
  const list: InvoiceIssueReason[] = [];

  return {
    list,
    push(code, message) {
      if (!list.some((issue) => issue.code === code && issue.message === message)) {
        list.push(issueReason(code, message));
      }
    },
  };
}

/**
 * 販売記録 1 件の税率。税の明細が 1 つで、扱える税率のときだけ決まる。
 * 0 円で税の明細が無いもの（送料無料など）は `"none"`。
 */
function saleRate(sale: CustomerAccountSale, amount: Yen, label: string, issues: Issues): TaxRatePercent | "none" | null {
  if (sale.taxes.length === 0) {
    if (amount === 0) {
      return "none";
    }
    issues.push("untaxedSale", `${label} に消費税がかかっていません（扱っていない税区分）`);
    return null;
  }
  if (sale.taxes.length > 1) {
    issues.push("multipleTaxLines", `${label} に税の明細が複数あります`);
    return null;
  }

  const [{ taxLine }] = sale.taxes;

  if (taxLine.channelLiable) {
    issues.push("channelLiableTax", `${label} の税を販売チャネルが納める設定になっています`);
    return null;
  }
  if (!TAX_RATE_PERCENTS.includes(taxLine.ratePercentage as TaxRatePercent)) {
    issues.push("unsupportedTaxRate", `${label} の税率（${taxLine.ratePercentage ?? "不明"}%）は扱っていません`);
    return null;
  }

  return taxLine.ratePercentage as TaxRatePercent;
}

/** 販売記録の金額と税額を、税率ごとにまとめる。返金は `sign` を -1 にして正の数にする */
function shopifyAmounts(sales: readonly CustomerAccountSale[], sign: 1 | -1, issues: Issues): ShopifyAmounts {
  const rates = new Map<number, { amount: number; tax: number }>();
  let total = 0;
  let tax = 0;

  for (const sale of sales) {
    const amount = sign * parseShopifyYen(sale.totalAmount);
    const saleTax = sign * parseShopifyYen(sale.totalTaxAmount);
    const lineTaxes = sale.taxes.map((part) => sign * parseShopifyYen(part.amount));

    if (lineTaxes.reduce((sum, value) => sum + value, 0) !== saleTax) {
      issues.push("saleTaxMismatch", `販売記録 ${sale.id} の税額の合計が合いません`);
    }

    total += amount;
    tax += saleTax;

    sale.taxes.forEach((part, index) => {
      const ratePercent = part.taxLine.ratePercentage ?? -1;
      const current = rates.get(ratePercent) ?? { amount: 0, tax: 0 };
      // 税の明細が 1 つの販売記録だけが税率に振り分けられる。複数のものは上で止めている
      current.amount += sale.taxes.length === 1 ? amount : 0;
      current.tax += lineTaxes[index];
      rates.set(ratePercent, current);
    });
  }

  return {
    total: yen(total),
    tax: yen(tax),
    rates: [...rates.entries()]
      .sort(([a], [b]) => b - a)
      .map(([ratePercent, value]) => ({ ratePercent, amount: yen(value.amount), tax: yen(value.tax) })),
  };
}

function buildSale(
  order: CustomerAccountInvoiceOrder,
  agreement: CustomerAccountAgreement | null,
  priceBasis: PriceBasis,
  issues: Issues
) {
  const lines: InvoiceOrderLine[] = [];
  let shipping: InvoiceShipping | null = null;
  let shippingSales = 0;
  const counted: CustomerAccountSale[] = [];

  for (const sale of agreement?.sales.nodes ?? []) {
    if (sale.actionType !== "ORDER") {
      issues.push("unexpectedSaleAction", `注文時の販売記録に ${sale.actionType} の記録があります`);
      continue;
    }

    const amount = parseShopifyYen(sale.totalAmount);
    const discount = parseShopifyYen(sale.totalDiscountAmountAfterTaxes);
    counted.push(sale);

    if (sale.__typename === "ProductSale" && sale.lineItem) {
      const label = receiptLineDescription(sale.lineItem.name, sale.lineItem.variantTitle);
      const rate = saleRate(sale, amount, label, issues);
      const quantity = sale.quantity ?? 0;

      if (!Number.isSafeInteger(quantity) || quantity <= 0) {
        issues.push("invalidQuantity", `${label} の数量が読めません`);
        continue;
      }
      if (!sale.lineItem.price) {
        issues.push("unitPriceMissing", `${label} の単価が取れていません`);
        continue;
      }
      if (lines.some((line) => line.lineId === sale.lineItem?.id)) {
        issues.push("duplicateLine", `${label} の販売記録が重複しています`);
        continue;
      }

      const unitPrice = parseShopifyYen(sale.lineItem.price);

      if (unitPrice * quantity - discount !== amount) {
        issues.push("lineAmountMismatch", `${label} の単価×数量−割引が、販売記録の金額と合いません`);
      }
      if (rate === "none") {
        issues.push("lineTaxUnknown", `${label} の税率が分かりません`);
        continue;
      }
      if (rate === null) {
        continue;
      }

      lines.push({
        lineId: sale.lineItem.id,
        description: label,
        quantity,
        unitPrice,
        discount,
        ratePercent: rate,
      });
      continue;
    }

    if (sale.__typename === "ShippingLineSale") {
      shippingSales += 1;
      const rate = saleRate(sale, amount, "送料", issues);

      // 送料無料（0 円）は、税の明細が 0 円でも無くても送料を載せない
      if (rate === null || rate === "none" || (amount === 0 && discount === 0)) {
        continue;
      }

      shipping = {
        title: order.shippingLine?.title ?? "送料",
        price: yen(amount + discount),
        discount,
        ratePercent: rate,
      };
      continue;
    }

    issues.push("unsupportedSale", `扱っていない販売記録（${sale.__typename}）があります`);
  }

  if (shippingSales > 1) {
    issues.push("multipleShippingSales", "送料の販売記録が複数あります");
  }

  return {
    orderId: order.id,
    orderName: order.name,
    priceBasis,
    processedAt: order.processedAt,
    lines,
    shipping,
    shopifyReference: agreement ? shopifyAmounts(counted, 1, issues) : null,
  };
}

function buildRefund(
  order: CustomerAccountInvoiceOrder,
  agreement: CustomerAccountAgreement,
  issues: Issues
): InvoiceRefund | null {
  const refundId = agreement.refund?.id;

  if (!refundId) {
    issues.push("refundAgreementWithoutRefund", "返金の記録の無い返金の販売記録があります");
    return null;
  }

  const refund: InvoiceRefund = {
    refundId,
    createdAt: agreement.happenedAt,
    lines: [],
    shipping: [],
    adjustments: [],
    refundedAmount: null,
    shopifyReference: null,
  };
  const counted: CustomerAccountSale[] = [];

  for (const sale of agreement.sales.nodes) {
    const amount = -parseShopifyYen(sale.totalAmount);
    const label = sale.lineItem?.name ?? sale.__typename;

    if (sale.actionType !== "RETURN" || amount < 0) {
      issues.push("unexpectedRefundSale", `返金の販売記録に、返金でない記録（${label}）があります`);
      continue;
    }

    counted.push(sale);
    const rate = saleRate(sale, yen(amount), `返金の ${label}`, issues);

    if (rate === "none" || rate === null) {
      if (rate === "none") {
        issues.push("refundTaxUnknown", `返金の ${label} の税率が分かりません`);
      }
      continue;
    }

    switch (sale.__typename) {
      case "ProductSale":
        if (!sale.lineItem || !sale.quantity || sale.quantity >= 0) {
          issues.push("refundQuantity", `返金の ${label} の数量が読めません`);
          continue;
        }
        refund.lines.push({ lineId: sale.lineItem.id, quantity: -sale.quantity, amount: yen(amount), ratePercent: rate });
        break;
      case "ShippingLineSale":
        refund.shipping.push({ amount: yen(amount), ratePercent: rate });
        break;
      case "AdjustmentSale":
        refund.adjustments.push({ description: "返金の調整", amount: yen(amount), ratePercent: rate });
        break;
      default:
        issues.push("unsupportedSale", `扱っていない返金の販売記録（${sale.__typename}）があります`);
    }
  }

  const recorded = order.refunds.find((candidate) => candidate.id === refundId);

  return {
    ...refund,
    createdAt: recorded?.createdAt ?? agreement.happenedAt,
    refundedAmount: recorded ? parseShopifyYen(recorded.totalRefunded) : null,
    shopifyReference: shopifyAmounts(counted, -1, issues),
  };
}

export function invoiceOrderFromCustomerAccount(
  order: CustomerAccountInvoiceOrder,
  options: { capturedAt: string; priceBasis: PriceBasis }
): InvoiceOrderRecord {
  if (order.currencyCode && order.currencyCode !== INVOICE_CURRENCY) {
    throw new InvoiceMoneyError(`円以外の通貨は扱いません: ${order.currencyCode}`);
  }

  const issues = issueList();
  const refundIssues = issueList();
  const agreements = order.agreements.nodes;

  if (
    order.agreements.pageInfo?.hasNextPage ||
    agreements.some((agreement) => agreement.sales.pageInfo?.hasNextPage) ||
    order.fulfillments.pageInfo?.hasNextPage ||
    order.fulfillments.nodes.some((fulfillment) => fulfillment.fulfillmentLineItems.pageInfo?.hasNextPage)
  ) {
    issues.push("truncated", "販売記録・出荷の記録を読み切れていません");
  }

  const orderAgreements = agreements.filter((agreement) => agreement.reason === "ORDER");

  if (orderAgreements.length !== 1) {
    issues.push("orderAgreement", "注文時の販売記録が 1 件ではありません");
  }
  if (order.edited || agreements.some((agreement) => agreement.reason === "ORDER_EDIT")) {
    issues.push("orderEdited", "注文が編集されています（個別に対応します）");
  }
  if (agreements.some((agreement) => agreement.reason === "RETURN")) {
    refundIssues.push("returnAgreement", "返品の販売記録があります（実際のデータで未確認のため個別に対応します）");
  }
  if (agreements.some((agreement) => !["ORDER", "ORDER_EDIT", "REFUND", "RETURN"].includes(agreement.reason))) {
    issues.push("unknownAgreement", "扱っていない種類の販売記録があります");
  }

  const sale = buildSale(order, orderAgreements.length === 1 ? orderAgreements[0] : null, options.priceBasis, issues);
  const refunds = agreements
    .filter((agreement) => agreement.reason === "REFUND")
    .flatMap((agreement) => {
      if (agreement.__typename !== "RefundAgreement") {
        refundIssues.push("unknownAgreement", "返金の販売記録の形が想定と違います");
        return [];
      }
      return buildRefund(order, agreement, refundIssues) ?? [];
    });

  for (const recorded of order.refunds) {
    if (!refunds.some((refund) => refund.refundId === recorded.id)) {
      refundIssues.push("refundWithoutAgreement", "販売記録の無い返金があります");
    }
  }

  const payments = order.transactions.map((transaction): InvoicePaymentTransaction => {
    if (UNSUPPORTED_PAYMENT_TYPES.has(transaction.type)) {
      issues.push("unsupportedPayment", `扱っていない支払い方法（${transaction.type}）の決済があります`);
    }

    return {
      transactionId: transaction.id,
      parentTransactionId: transaction.transactionParentId,
      kind: TRANSACTION_KINDS[transaction.kind ?? ""] ?? "other",
      status: TRANSACTION_STATUSES[transaction.status ?? ""] ?? "unknown",
      amount: parseShopifyYen(transaction.transactionAmount.presentmentMoney),
      manual: MANUAL_PAYMENT_TYPES.has(transaction.type),
      processedAt: transaction.processedAt,
    };
  });

  return {
    capturedAt: options.capturedAt,
    source: "customerAccountApi",
    sale,
    payments,
    fulfillments: order.fulfillments.nodes.map((fulfillment) => ({
      fulfillmentId: fulfillment.id,
      status: FULFILLMENT_STATUSES[fulfillment.status] ?? "unknown",
      shippedAt: fulfillment.createdAt,
      lines: fulfillment.fulfillmentLineItems.nodes.map((part) => ({
        lineId: part.lineItem.id,
        quantity: part.quantity,
      })),
    })),
    cancellation: order.cancelledAt ? { cancelledAt: order.cancelledAt, reason: order.cancelReason } : null,
    refunds,
    shopifyStatus: {
      financialStatus: order.financialStatus,
      totalRefunded: parseShopifyYen(order.totalRefunded),
    },
    dataIssues: issues.list,
    refundIssues: refundIssues.list,
  };
}