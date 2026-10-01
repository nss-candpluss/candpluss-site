import Link from "next/link";
import { redirect } from "next/navigation";

import { accountTextLinkClassName } from "@/components/commerce/accountStyles";
import { ReceiptPrintButton } from "@/components/commerce/ReceiptPrintButton";
import { ReceiptSheet } from "@/components/commerce/ReceiptSheet";
import {
  isQualifiedInvoiceReady,
  receiptFileName,
  receiptIssuer,
  receiptLineDescription,
  receiptSummaryAmounts,
} from "@/data/receipt";
import {
  ACCOUNT_BASE_PATH,
  ACCOUNT_LOGIN_PATH,
} from "@/lib/commerce/account-login";
import {
  fetchCustomerOrder,
  type CustomerMoney,
} from "@/lib/shopify/customer-account";
import { getLiveCustomerTokenSession } from "@/lib/shopify/customer-session";
import { bodyText, sectionTitle62ClassName } from "@/lib/typography";

type AccountReceiptContentProps = {
  /** 注文の gid。`AccountPageContent` からエンコードして渡す */
  order?: string;
};

function amountOf(money?: CustomerMoney | null) {
  return money ? Number(money.amount) : 0;
}

const mainClassName =
  "px-[var(--container-x)] pt-[calc(var(--header-height)+var(--container-y-top))] pb-[var(--container-y-bottom)]";

/**
 * 会員が自分で発行する領収書。
 *
 * Shopify は領収書そのものを配ってくれないので、注文データから組み立てる。
 * 宛名は請求先の氏名で固定し、PDF はブラウザ上で作って保存させる。
 */
export async function AccountReceiptContent({
  order: orderParam,
}: AccountReceiptContentProps) {
  const session = await getLiveCustomerTokenSession();

  if (!session) {
    redirect(ACCOUNT_LOGIN_PATH);
  }

  const orderId = orderParam ? decodeURIComponent(orderParam) : null;
  const order = orderId
    ? await fetchCustomerOrder(session.accessToken, orderId).catch(() => null)
    : null;

  if (!order) {
    return (
      <main data-header-theme="onLight" className={mainClassName}>
        <h1 className={`font-heading ${sectionTitle62ClassName}`}>Receipt</h1>
        <p className={`mt-[var(--section-title-gap)] font-body-ja ${bodyText(15)}`}>
          対象の注文が見つかりませんでした。
        </p>
        <Link
          href={ACCOUNT_BASE_PATH}
          className={`mt-[calc(32px*var(--gap-scale-y))] inline-block ${accountTextLinkClassName} ${bodyText(15)}`}
        >
          マイページへ戻る
        </Link>
      </main>
    );
  }

  const amounts = receiptSummaryAmounts({
    total: amountOf(order.totalPrice),
    shipping: amountOf(order.totalShipping),
    tax: amountOf(order.totalTax),
  });

  return (
    <main data-header-theme="onLight" data-receipt-page className={mainClassName}>
      <div className="mx-auto max-w-[720px]">
        <div className="flex justify-end print:hidden">
          <ReceiptPrintButton fileName={receiptFileName(order.name, order.processedAt)} />
        </div>

        {/* ここから下が印刷される領域 */}
        <div className="mt-[calc(24px*var(--gap-scale-y))] border border-[var(--color-divider)] p-[4%] print:mt-0 print:border-0 print:p-0">
          <ReceiptSheet
            recipientName={order.billingAddress?.name?.trim() ?? ""}
            issuedAt={order.processedAt}
            orderName={order.name}
            registrationNumber={
              isQualifiedInvoiceReady()
                ? receiptIssuer.invoiceRegistrationNumber
                : null
            }
            subtotalExcludingTax={amounts.subtotalExcludingTax}
            shippingExcludingTax={amounts.shippingExcludingTax}
            tax={amounts.tax}
            total={amounts.total}
            lines={order.lineItems.nodes.map((item) => ({
              id: item.id,
              description: receiptLineDescription(item.name, item.variantTitle),
              quantity: item.quantity,
              amount: amountOf(item.totalPrice ?? item.price),
            }))}
          />
        </div>
      </div>
    </main>
  );
}
