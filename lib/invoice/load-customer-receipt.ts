import "server-only";

import { receiptIssuer } from "@/data/receipt";
import {
  INVOICE_RULES_VERSION,
  INVOICE_ISSUE_POLICY,
  INVOICE_TAX_CONFIG,
  INVOICE_TRANSACTION_DATE_BASIS,
} from "@/lib/invoice/config";
import {
  customerReceiptFromAccountOrder,
  type CustomerReceiptResult,
} from "@/lib/invoice/customer-receipt";
import { fetchCustomerInvoiceOrder } from "@/lib/shopify/customer-account";

/**
 * ログイン中のお客様本人の注文から、書類と返金の状況を組み立てる。
 *
 * 失敗しても例外を投げず、`fetchFailed` などを返す。注文履歴など、既存の表示を
 * 巻き込まないため。エラーの内容には注文の情報が含まれうるので、ログに出さない。
 *
 * 会員ページでの発行の可否は `RECEIPT_ISSUE_ENABLED` で切り替える。
 */
export type LoadedCustomerReceipt =
  | CustomerReceiptResult
  | { status: "notFound" }
  | { status: "fetchFailed" }
  | { status: "failed" };

export async function loadCustomerReceipt(
  accessToken: string,
  orderId: string,
  now: () => Date = () => new Date()
): Promise<LoadedCustomerReceipt> {
  let order: Awaited<ReturnType<typeof fetchCustomerInvoiceOrder>>;

  try {
    order = await fetchCustomerInvoiceOrder(accessToken, orderId);
  } catch {
    return { status: "fetchFailed" };
  }

  if (!order) {
    return { status: "notFound" };
  }

  try {
    return customerReceiptFromAccountOrder(order, {
      capturedAt: now().toISOString(),
      issuer: {
        name: receiptIssuer.name,
        brandName: receiptIssuer.brandName,
        registrationNumber: receiptIssuer.invoiceRegistrationNumber,
      },
      rulesVersion: INVOICE_RULES_VERSION,
      taxConfig: INVOICE_TAX_CONFIG,
      transactionDateBasis: INVOICE_TRANSACTION_DATE_BASIS,
      policy: INVOICE_ISSUE_POLICY,
    });
  } catch {
    return { status: "failed" };
  }
}
