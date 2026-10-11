import { customerAccountRequest } from "@/lib/shopify/customer-account";
import { getLiveCustomerTokenSession } from "@/lib/shopify/customer-session";

/**
 * 一時的な確認用。ログイン中のお客様本人の注文から、領収書の設計に要る
 * 金額・税・状態だけを読む。住所・氏名・連絡先・カード情報は問い合わせない。
 */
const PROBE_EXPIRES_AT = Date.parse("2026-10-14T23:59:59+09:00");
const ORDER_COUNT = 10;

const MONEY = "{ amount currencyCode }";

const SECTIONS = {
  totals: `
    id name processedAt createdAt updatedAt cancelledAt cancelReason edited
    financialStatus fulfillmentStatus
    subtotal ${MONEY} totalTax ${MONEY} totalShipping ${MONEY}
    totalRefunded ${MONEY} totalPrice ${MONEY}
    paymentInformation {
      paymentStatus
      totalPaidAmount ${MONEY}
      totalOutstandingAmount ${MONEY}
    }
    shippingLine { title handle originalPrice ${MONEY} }
    lineItems(first: 50) {
      nodes {
        id name quantity refundableQuantity
        price ${MONEY} totalPrice ${MONEY} currentTotalPrice ${MONEY}
        totalDiscount ${MONEY}
      }
    }`,
  agreements: `
    name
    agreements(first: 20) {
      nodes {
        __typename id happenedAt reason
        ... on RefundAgreement { refund { id } }
        sales(first: 50) {
          nodes {
            __typename id actionType lineType quantity
            totalAmount ${MONEY} totalTaxAmount ${MONEY}
            totalDiscountAmountBeforeTaxes ${MONEY}
            totalDiscountAmountAfterTaxes ${MONEY}
            taxes {
              amount ${MONEY}
              taxLine { title rate ratePercentage source channelLiable priceSet ${MONEY} }
            }
            ... on ProductSale { lineItem { id name } }
          }
        }
      }
    }`,
  payments: `
    name
    refunds { id createdAt updatedAt returnName totalRefunded ${MONEY} }
    transactions {
      id kind status type createdAt processedAt transactionParentId
      transactionAmount { presentmentMoney ${MONEY} }
      typeDetails { name }
    }
    fulfillments(first: 10) {
      nodes {
        id status latestShipmentStatus createdAt updatedAt
        fulfillmentLineItems(first: 50) { nodes { quantity lineItem { id } } }
        events(first: 20) { nodes { status happenedAt } }
      }
    }`,
  discounts: `
    name
    shippingDiscountAllocations { allocatedAmount ${MONEY} }
    discountApplications(first: 10) {
      nodes {
        __typename allocationMethod targetSelection targetType
        value {
          ... on MoneyV2 { amount currencyCode }
          ... on PricingPercentageValue { percentage }
        }
      }
    }
    lineItems(first: 50) {
      nodes { id discountAllocations { allocatedAmount ${MONEY} } }
    }`,
} as const;

const HEADERS = {
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex, nofollow",
};

export async function GET() {
  if (Date.now() > PROBE_EXPIRES_AT) {
    return new Response("Not Found", { status: 404, headers: HEADERS });
  }

  const session = await getLiveCustomerTokenSession();
  if (!session) {
    return Response.json({ error: "not logged in" }, { status: 401, headers: HEADERS });
  }

  const result: Record<string, unknown> = {};
  for (const [section, fields] of Object.entries(SECTIONS)) {
    try {
      const data = await customerAccountRequest<{
        customer?: { orders: { nodes: unknown[] } } | null;
      }>(
        session.accessToken,
        `query InvoiceProbe($first: Int!) {
          customer { orders(first: $first, reverse: true) { nodes { ${fields} } } }
        }`,
        { first: ORDER_COUNT }
      );
      result[section] = data.customer?.orders.nodes ?? [];
    } catch (cause) {
      result[section] = { error: cause instanceof Error ? cause.message : String(cause) };
    }
  }

  return Response.json(result, { headers: HEADERS });
}
