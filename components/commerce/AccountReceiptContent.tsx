import Link from "next/link";
import { redirect } from "next/navigation";

import { ReceiptPrintButton } from "@/components/commerce/ReceiptPrintButton";
import {
  RECEIPT_TAX_RATE_PERCENT,
  isQualifiedInvoiceReady,
  receiptIssuer,
  receiptNotes,
} from "@/data/receipt";
import {
  ACCOUNT_BASE_PATH,
  ACCOUNT_LOGIN_START_PATH,
} from "@/lib/commerce/account-login";
import {
  fetchCustomerOrder,
  type CustomerMoney,
} from "@/lib/shopify/customer-account";
import { getLiveCustomerTokenSession } from "@/lib/shopify/customer-session";
import { inputText } from "@/lib/typography";

type AccountReceiptContentProps = {
  /** 注文の gid。`AccountPageContent` からエンコードして渡す */
  order?: string;
  /** 購入者が指定する宛名 */
  to?: string;
  /** 但し書き。未指定なら商品名から組み立てる */
  note?: string;
};

function formatMoney(money?: CustomerMoney | null) {
  if (!money) {
    return "—";
  }

  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: money.currencyCode,
    maximumFractionDigits: 0,
  }).format(Number(money.amount));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ja-JP", { dateStyle: "long" }).format(
    new Date(value)
  );
}

/** 但し書きの既定値。「〇〇 他2点」の形にする */
function defaultNote(itemNames: string[]) {
  if (!itemNames.length) {
    return "商品代として";
  }

  const [first, ...rest] = itemNames;

  return rest.length
    ? `${first} 他${rest.length}点 代として`
    : `${first} 代として`;
}

const inputClassName =
  `mt-2 w-full border border-[#ccc] bg-transparent px-4 py-3 font-body-ja ${inputText(14)}`;

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-[#eee] py-3">
      <span className="font-body-ja text-sm">{label}</span>
      <span
        className={`font-ui-en text-sm ${strong ? "text-lg font-semibold" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}

/**
 * 会員が自分で発行する領収書。
 *
 * Shopify は領収書そのものを配ってくれないので、注文データから組み立てる。
 * 宛名と但し書きは購入者が入力し、そのままブラウザの印刷から PDF にできる。
 */
export async function AccountReceiptContent({
  order: orderParam,
  to,
  note,
}: AccountReceiptContentProps) {
  const session = await getLiveCustomerTokenSession();

  if (!session) {
    redirect(ACCOUNT_LOGIN_START_PATH);
  }

  const orderId = orderParam ? decodeURIComponent(orderParam) : null;
  const order = orderId
    ? await fetchCustomerOrder(session.accessToken, orderId).catch(() => null)
    : null;

  if (!order) {
    return (
      <main
        data-header-theme="onLight"
        className="px-[var(--container-x)] pt-[calc(var(--header-height)+var(--container-y-top))] pb-[var(--container-y-bottom)]"
      >
        <h1 className="font-heading text-[clamp(38px,calc(24.13px+3.7vw),62px)] leading-none">
          Receipt
        </h1>
        <p className="mt-12 font-body-ja text-sm">
          対象の注文が見つかりませんでした。
        </p>
        <Link
          href={ACCOUNT_BASE_PATH}
          className="mt-8 inline-flex border-b border-current font-ui-en text-sm"
        >
          BACK TO ACCOUNT
        </Link>
      </main>
    );
  }

  const itemNames = order.lineItems.nodes.map((item) => item.name);
  const recipientName =
    to?.trim() ||
    order.billingAddress?.name?.trim() ||
    "";
  const purpose = note?.trim() || defaultNote(itemNames);
  const showRegistrationNumber = isQualifiedInvoiceReady();

  return (
    <main
      data-header-theme="onLight"
      data-receipt-page
      className="px-[var(--container-x)] pt-[calc(var(--header-height)+var(--container-y-top))] pb-[var(--container-y-bottom)]"
    >
      <div className="print:hidden">
        <h1 className="font-heading text-[clamp(38px,calc(24.13px+3.7vw),62px)] leading-none">
          Receipt
        </h1>

        <form method="get" className="mt-12 max-w-[560px]">
          <input type="hidden" name="order" value={orderParam ?? ""} />
          <label className="block font-body-ja text-sm">
            宛名
            <input
              name="to"
              defaultValue={recipientName}
              maxLength={100}
              placeholder="株式会社○○"
              className={inputClassName}
            />
          </label>
          <label className="mt-5 block font-body-ja text-sm">
            但し書き
            <input
              name="note"
              defaultValue={purpose}
              maxLength={100}
              className={inputClassName}
            />
          </label>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <button
              type="submit"
              className="bg-[var(--foreground)] px-6 py-4 font-ui-en text-sm text-white"
            >
              UPDATE
            </button>
            <ReceiptPrintButton />
            <Link
              href={ACCOUNT_BASE_PATH}
              className="border-b border-current font-ui-en text-sm"
            >
              BACK TO ACCOUNT
            </Link>
          </div>
        </form>

        {!showRegistrationNumber ? (
          <p className="mt-8 max-w-[560px] font-body-ja text-sm text-[#9b1b30]">
            適格請求書発行事業者の登録番号が未設定のため、登録番号と税率別内訳を
            印字していません。インボイス対応が必要な場合は
            <code className="mx-1">data/receipt.ts</code>
            に登録番号を設定してください。
          </p>
        ) : null}
      </div>

      {/* ここから下が印刷される領域 */}
      <section className="mx-auto mt-16 max-w-[720px] border border-[#ddd] p-10 print:mt-0 print:border-0 print:p-0">
        <h2 className="text-center font-body-ja text-2xl font-semibold tracking-[0.3em]">
          領収書
        </h2>

        <div className="mt-10 flex items-end justify-between gap-6">
          <p className="min-w-0 flex-1 border-b border-[#333] pb-2 font-body-ja text-lg">
            {recipientName || "　"}
            <span className="ml-2 text-sm">様</span>
          </p>
          <p className="font-body-ja text-sm">{formatDate(order.processedAt)}</p>
        </div>

        <p className="mt-10 border-b-2 border-[#333] pb-3 text-center font-ui-en text-3xl font-semibold">
          {formatMoney(order.totalPrice)}
        </p>

        <p className="mt-6 font-body-ja text-sm">但し {purpose}</p>
        <p className="mt-2 font-body-ja text-sm">
          上記正に領収いたしました。
        </p>

        <div className="mt-10 grid gap-10 min-[640px]:grid-cols-2">
          <div>
            <h3 className="font-body-ja text-sm font-semibold">内訳</h3>
            <div className="mt-3">
              <Row label="小計" value={formatMoney(order.subtotal)} />
              <Row label="送料" value={formatMoney(order.totalShipping)} />
              {showRegistrationNumber ? (
                <>
                  <Row
                    label={`${RECEIPT_TAX_RATE_PERCENT}%対象（税込）`}
                    value={formatMoney(order.totalPrice)}
                  />
                  <Row
                    label="うち消費税"
                    value={formatMoney(order.totalTax)}
                  />
                </>
              ) : (
                <Row label="消費税" value={formatMoney(order.totalTax)} />
              )}
              <Row
                label="合計（税込）"
                value={formatMoney(order.totalPrice)}
                strong
              />
              {Number(order.totalRefunded.amount) > 0 ? (
                <Row
                  label="返金額"
                  value={formatMoney(order.totalRefunded)}
                />
              ) : null}
            </div>
          </div>

          <div>
            <h3 className="font-body-ja text-sm font-semibold">発行者</h3>
            <div className="mt-3 font-body-ja text-sm leading-relaxed">
              <p>{receiptIssuer.name}</p>
              <p>{receiptIssuer.postalCode}</p>
              <p>{receiptIssuer.address}</p>
              <p>TEL {receiptIssuer.tel}</p>
              {showRegistrationNumber ? (
                <p className="mt-2">
                  登録番号 {receiptIssuer.invoiceRegistrationNumber}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-10">
          <h3 className="font-body-ja text-sm font-semibold">明細</h3>
          <table className="mt-3 w-full border-collapse font-body-ja text-sm">
            <thead>
              <tr className="border-b border-[#333]">
                <th className="py-2 text-left font-normal">商品</th>
                <th className="py-2 text-right font-normal">数量</th>
                <th className="py-2 text-right font-normal">金額</th>
              </tr>
            </thead>
            <tbody>
              {order.lineItems.nodes.map((item) => (
                <tr key={item.id} className="border-b border-[#eee]">
                  <td className="py-2">
                    {item.name}
                    {item.variantTitle && item.variantTitle !== "Default Title"
                      ? ` / ${item.variantTitle}`
                      : ""}
                  </td>
                  <td className="py-2 text-right font-ui-en">
                    {item.quantity}
                  </td>
                  <td className="py-2 text-right font-ui-en">
                    {formatMoney(item.totalPrice ?? item.price)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-8 font-body-ja text-xs text-[var(--color-muted)]">
          注文番号 {order.name}
        </p>
        {receiptNotes.map((text) => (
          <p
            key={text}
            className="mt-1 font-body-ja text-xs text-[var(--color-muted)]"
          >
            {text}
          </p>
        ))}
      </section>
    </main>
  );
}
