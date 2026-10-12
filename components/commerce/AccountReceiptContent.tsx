import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import {
  accountSubHeadingClassName,
  accountTextLinkClassName,
} from "@/components/commerce/accountStyles";
import { ReturnInvoiceSheet, SimplifiedInvoiceSheet } from "@/components/commerce/InvoiceSheet";
import { ReceiptPrintButton } from "@/components/commerce/ReceiptPrintButton";
import { RECEIPT_ISSUE_ENABLED } from "@/data/receipt";
import {
  ACCOUNT_BASE_PATH,
  ACCOUNT_LOGIN_PATH,
  ACCOUNT_RECEIPT_PATH,
  accountReceiptHref,
  accountSessionRefreshHref,
} from "@/lib/commerce/account-login";
import {
  customerReceiptView,
  invoiceFileName,
  RECEIPT_NOTICES,
  REFUND_NOTICES,
  RETURN_INVOICE_NOTICE,
  type CustomerReceiptView,
  type CustomerRefundView,
} from "@/lib/invoice/customer-receipt-view";
import { loadCustomerReceipt } from "@/lib/invoice/load-customer-receipt";
import {
  getLiveCustomerTokenSession,
  hasRefreshableCustomerTokenSession,
} from "@/lib/shopify/customer-session";
import { bodyText, sectionTitle62ClassName } from "@/lib/typography";

type AccountReceiptContentProps = {
  /** 注文の gid。`AccountPageContent` からエンコードして渡す */
  order?: string;
};

const mainClassName =
  "px-[var(--container-x)] pt-[calc(var(--header-height)+var(--container-y-top))] pb-[var(--container-y-bottom)]";

const sheetBoxClassName =
  "mt-[calc(24px*var(--gap-scale-y))] border border-[var(--color-divider)] p-[4%] print:mt-0 print:border-0 print:p-0";

function yenText(value: number) {
  return `${value.toLocaleString("ja-JP")}円`;
}

/** 返金の状況。書類とは別に示し、印刷・PDF には含めない */
function RefundStatus({ refunds }: { refunds: CustomerRefundView }) {
  return (
    <section className="mt-[calc(40px*var(--gap-scale-y))] print:hidden" aria-labelledby="refund-status">
      <h2 id="refund-status" className={accountSubHeadingClassName}>
        ご返金の状況
      </h2>
      <div className={`mt-[calc(16px*var(--gap-scale-y))] font-body-ja ${bodyText(15)}`}>
        {refunds.refunded > 0 ? <p>ご返金済み：{yenText(refunds.refunded)}</p> : null}
        {refunds.pending > 0 ? <p>ご返金の手続き中：{yenText(refunds.pending)}</p> : null}
        {refunds.failed ? <p>{REFUND_NOTICES.failed}</p> : null}
        {refunds.needsReview ? <p>{REFUND_NOTICES.needsReview}</p> : null}
        <p className="mt-[calc(8px*var(--gap-scale-y))]">{REFUND_NOTICES.original}</p>
      </div>
    </section>
  );
}

function BackLink() {
  return (
    <Link
      href={ACCOUNT_BASE_PATH}
      className={`mt-[calc(32px*var(--gap-scale-y))] inline-block ${accountTextLinkClassName} ${bodyText(15)}`}
    >
      マイページへ戻る
    </Link>
  );
}

/**
 * 会員が自分で発行する領収書 兼 適格簡易請求書。
 *
 * Shopify は領収書そのものを配ってくれないので、注文時の販売記録・決済・出荷の記録から
 * 毎回組み立てる（`lib/invoice`）。現在の合計（キャンセル・返金後の金額）は使わない。
 * 返金は領収書を書き換えず、返金の状況と適格返還請求書で別に示す。
 * PDF はブラウザ上で作って保存させ、サーバーには残さない。
 */
export async function AccountReceiptContent({
  order: orderParam,
}: AccountReceiptContentProps) {
  if (!RECEIPT_ISSUE_ENABLED) {
    notFound();
  }

  const session = await getLiveCustomerTokenSession();

  if (!session) {
    if (await hasRefreshableCustomerTokenSession()) {
      redirect(
        accountSessionRefreshHref(
          orderParam ? accountReceiptHref(orderParam) : ACCOUNT_RECEIPT_PATH
        )
      );
    }
    redirect(ACCOUNT_LOGIN_PATH);
  }

  const orderId = orderParam ? decodeURIComponent(orderParam) : null;

  return (
    <AccountReceiptView
      view={customerReceiptView(
        orderId ? await loadCustomerReceipt(session.accessToken, orderId) : { status: "notFound" }
      )}
    />
  );
}

/** 領収書のページの中身。判定の済んだ内容だけを受け取り、取得や認証はしない */
export function AccountReceiptView({ view }: { view: CustomerReceiptView }) {
  if (view.status === "notice") {
    return (
      <main data-header-theme="onLight" className={mainClassName}>
        <h1 className={`font-heading ${sectionTitle62ClassName}`}>Receipt</h1>
        <p className={`mt-[var(--section-title-gap)] font-body-ja ${bodyText(15)}`}>
          {RECEIPT_NOTICES[view.notice]}
        </p>
        {view.refunds ? <RefundStatus refunds={view.refunds} /> : null}
        <BackLink />
      </main>
    );
  }

  return (
    <main data-header-theme="onLight" data-receipt-page className={mainClassName}>
      <div className="mx-auto max-w-[720px]">
        <div className="flex justify-end print:hidden">
          <ReceiptPrintButton
            fileName={invoiceFileName(view.invoice)}
            sheetKey={view.invoice.documentId}
          />
        </div>

        {/* ここから下が印刷される領域 */}
        <div className={sheetBoxClassName}>
          <SimplifiedInvoiceSheet document={view.invoice} />
        </div>

        {view.refunds ? <RefundStatus refunds={view.refunds} /> : null}

        {view.returnInvoices.map((document, index) => (
          <section key={document.documentId} className="mt-[calc(40px*var(--gap-scale-y))] print:mt-0 print:break-before-page">
            <div className="flex justify-end print:hidden">
              <ReceiptPrintButton
                fileName={invoiceFileName(document, index)}
                sheetKey={document.documentId}
                label="適格返還請求書のPDFダウンロード"
              />
            </div>
            <div className={sheetBoxClassName}>
              <ReturnInvoiceSheet document={document} />
            </div>
          </section>
        ))}

        {view.returnInvoiceWithheld ? (
          <p className={`mt-[calc(24px*var(--gap-scale-y))] font-body-ja ${bodyText(15)} print:hidden`}>
            {RETURN_INVOICE_NOTICE}
          </p>
        ) : null}
      </div>
    </main>
  );
}
