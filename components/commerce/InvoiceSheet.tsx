import type { ReactNode } from "react";

import { receiptIssuer } from "@/data/receipt";
import {
  INVOICE_DOCUMENT_TITLES,
  InvoiceDocumentError,
  STATEMENT_TAX_RATE_PERCENT,
  type InvoiceDocument,
  type ReturnInvoiceDocument,
  type SimplifiedInvoiceDocument,
} from "@/lib/invoice/documents";
import { isReducedRate } from "@/lib/invoice/tax";

/*
  株式会社NSS 指定の利用明細書の書式（`ReceiptSheet`）をもとにする。寸法は用紙の幅に対する割合（cqw）で持つ。
  画面では 1 枚に続けて出し、A4（余白 12mm）に収まらない分は PDF・印刷で明細の行の切れ目から
  次のページに送る（`lib/commerce/receipt-pdf.ts`）。文字は縮めないので、明細より上は 1 ページ目に収める。
  集計欄の金額は書類（`lib/invoice/documents.ts`）の値をそのまま出し、ここでは計算しない。
*/
const cellClassName = "border border-[#333] px-[1.9cqw]";
const headClassName = `${cellClassName} h-[3.9cqw] text-center text-[1.6cqw] leading-none font-normal`;
const summaryValueClassName = `${cellClassName} h-[6.6cqw] text-right text-[1.6cqw] leading-none`;
const summaryCellClassName = `${cellClassName} h-[4.7cqw] text-[1.6cqw] leading-none`;
// 長い商品名は折り返す。1 行の行は高さ 4.4cqw のまま、折り返した行だけ上下に余白を持って高くなる
const detailCellClassName = `${cellClassName} h-[4.4cqw] py-[0.6cqw] text-[1.6cqw] leading-[1.3]`;
const metaRowClassName = "grid grid-cols-[15cqw_auto] text-[1.6cqw] leading-[2.75cqw]";
const noteClassName = "text-[1.4cqw] leading-[2.4cqw]";

function yenText(value: number) {
  return value < 0 ? `−${(-value).toLocaleString("ja-JP")}` : value.toLocaleString("ja-JP");
}

/** 「2026-10-09」を「2026年10月9日」にする。書類の日付は日本時間の年月日 */
export function formatDocumentDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);

  return `${year}年${month}月${day}日`;
}

function rateLabel(ratePercent: number, reducedRate: boolean) {
  return reducedRate ? `${ratePercent}%対象（軽減税率）` : `${ratePercent}%対象`;
}

type DetailRow = {
  key: string;
  description: string;
  quantity: number | null;
  /** 税込金額 */
  amount: number;
  /** 割引のように、前の行と同じページに置く行 */
  keepWithPrevious?: boolean;
};

function MetaList({ rows }: { rows: [string, string][] }) {
  return (
    <dl>
      {rows.map(([term, value]) => (
        <div key={term} className={metaRowClassName}>
          <dt>{term}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function IssuerBlock({ document }: { document: InvoiceDocument }) {
  return (
    <div className="mt-[2.75cqw] text-[1.6cqw] leading-[2.75cqw]">
      {document.issuer.brandName ? <p>{document.issuer.brandName}</p> : null}
      <p>TEL：{receiptIssuer.tel}</p>
      <p className="mt-[2.75cqw]">運営：{document.issuer.name}</p>
      <p>{receiptIssuer.postalCode}</p>
      <p>{receiptIssuer.address}</p>
    </div>
  );
}

/** NSS 指定の集計欄。税抜合計・送料（税抜）・消費税（10%）・合計金額 */
function StatementSummary({ document }: { document: SimplifiedInvoiceDocument }) {
  const summary = document.statement;

  // 集計欄を作れない注文は、発行の判定（`customer-receipt.ts`）で止めている
  if (!summary) {
    throw new InvoiceDocumentError("利用明細書の集計欄を作れない書類です");
  }

  return (
    <table className="mt-[3.9cqw] w-[69.2%] table-fixed border-collapse">
      <thead>
        <tr>
          <th className={headClassName}>税抜合計</th>
          <th className={headClassName}>送料（税抜）</th>
          <th className={headClassName}>消費税（{STATEMENT_TAX_RATE_PERCENT}%）</th>
          <th className={headClassName}>合計金額</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className={summaryValueClassName}>{yenText(summary.productsExcludingTax)} 円</td>
          <td className={summaryValueClassName}>{yenText(summary.shippingExcludingTax)} 円</td>
          <td className={summaryValueClassName}>{yenText(summary.tax)} 円</td>
          <td className={`${summaryValueClassName} text-[1.8cqw] font-semibold`}>{yenText(summary.total)} 円</td>
        </tr>
      </tbody>
    </table>
  );
}

/** 適格返還請求書の、税率ごとの返還金額と消費税額 */
function RateSummary({ document }: { document: ReturnInvoiceDocument }) {
  return (
    <table className="mt-[3.9cqw] w-[69.2%] table-fixed border-collapse">
      <colgroup>
        <col className="w-[38%]" />
        <col className="w-[34%]" />
        <col className="w-[28%]" />
      </colgroup>
      <thead>
        <tr>
          <th className={headClassName}>税率区分</th>
          <th className={headClassName}>返還金額</th>
          <th className={headClassName}>消費税額</th>
        </tr>
      </thead>
      <tbody>
        {document.taxSummary.rates.map((rate) => (
          <tr key={rate.ratePercent}>
            <td className={`${summaryCellClassName} text-left`}>
              {rateLabel(rate.ratePercent, isReducedRate(rate.ratePercent))}
            </td>
            <td className={`${summaryCellClassName} text-right`}>{yenText(rate.totalIncludingTax)} 円</td>
            <td className={`${summaryCellClassName} text-right`}>{yenText(rate.tax)} 円</td>
          </tr>
        ))}
        <tr>
          <td className={`${summaryCellClassName} text-left`}>合計</td>
          <td className={`${summaryCellClassName} text-right font-semibold`}>
            {yenText(document.taxSummary.total)} 円
          </td>
          <td className={`${summaryCellClassName} text-right`}>{yenText(document.taxSummary.tax)} 円</td>
        </tr>
      </tbody>
    </table>
  );
}

/** NSS 指定の明細。摘要・数量・税込金額。行は内容の数だけ出す */
function DetailTable({ rows }: { rows: DetailRow[] }) {
  return (
    <table data-receipt-detail className="mt-[4.4cqw] w-full table-fixed border-collapse">
      <colgroup>
        <col className="w-[61.1%]" />
        <col className="w-[16.6%]" />
        <col className="w-[22.3%]" />
      </colgroup>
      <thead>
        <tr>
          <th className={headClassName}>摘要</th>
          <th className={headClassName}>数量</th>
          <th className={headClassName}>税込金額</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr
            key={row.key}
            data-receipt-keep-with-previous={row.keepWithPrevious || undefined}
            className="break-inside-avoid"
          >
            <td className={`${detailCellClassName} text-left`}>{row.description}</td>
            <td className={`${detailCellClassName} text-center`}>{row.quantity ?? ""}</td>
            <td className={`${detailCellClassName} text-right`}>{yenText(row.amount)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function SheetFrame({
  sheetKey,
  title,
  lead,
  meta,
  document,
  children,
}: {
  sheetKey: string;
  title: string;
  lead: ReactNode;
  meta: [string, string][];
  document: InvoiceDocument;
  children: ReactNode;
}) {
  return (
    <div className="@container">
      <article
        data-receipt-sheet={sheetKey}
        data-receipt-continuation={`${title}（続き）　ご注文 ${document.orderName}`}
        className="bg-white font-body-ja text-[var(--foreground)]"
      >
        <h1 className="text-center font-body-ja text-[4.5cqw] leading-none font-normal">{title}</h1>

        <div className="mt-[7.5cqw] flex items-start justify-between gap-[4cqw]">
          <div className="min-w-0">{lead}</div>
          <div className="shrink-0">
            <MetaList rows={meta} />
            <IssuerBlock document={document} />
          </div>
        </div>

        {children}
      </article>
    </div>
  );
}

function AmountLead({ label, amount, note }: { label: string; amount: number; note: string }) {
  return (
    <>
      <p className="text-[1.6cqw] leading-none">{label}</p>
      <p className="mt-[1.6cqw] border-b border-[#333] pb-[1.2cqw] text-[3.6cqw] leading-none font-semibold">
        ¥{yenText(amount)}-
      </p>
      <p className="mt-[1.6cqw] text-[1.6cqw] leading-[2.75cqw]">{note}</p>
    </>
  );
}

/**
 * 領収書の欄の日付の見出し。Shopify の決済の記録の日で、実際にお金が届いた日とは限らない。
 * 銀行振込などの手動の決済は、当店が入金を確認して登録した日になる
 */
export function receiptDateLabel(document: SimplifiedInvoiceDocument) {
  return document.receipt.manualPayment ? "入金確認日" : "決済日";
}

function registrationRow(document: InvoiceDocument): [string, string] {
  return ["登録番号", document.issuer.registrationNumber];
}

/** 明細の行（税込）。割引は商品の直後に、請求額 0 円の送料は出さない（集計欄の送料は 0 円と出す） */
export function invoiceDetailRows(document: SimplifiedInvoiceDocument): DetailRow[] {
  const rows: DetailRow[] = document.lines.flatMap((line) => [
    {
      key: line.lineId,
      description: line.description,
      quantity: line.quantity,
      amount: line.unitPrice * line.quantity,
    },
    ...(line.discount > 0
      ? [
          {
            key: `${line.lineId}:discount`,
            description: "　割引",
            quantity: null,
            amount: -line.discount,
            keepWithPrevious: true,
          },
        ]
      : []),
  ]);

  if (document.shipping && document.shipping.amount > 0) {
    rows.push({
      key: "shipping",
      description: `送料（${document.shipping.title}）`,
      quantity: null,
      amount: document.shipping.price,
    });
    if (document.shipping.discount > 0) {
      rows.push({
        key: "shipping:discount",
        description: "　送料の割引",
        quantity: null,
        amount: -document.shipping.discount,
        keepWithPrevious: true,
      });
    }
  }

  return rows;
}

/** 利用明細書（兼 適格簡易請求書）。小売業の適格簡易請求書なので、宛名は載せない */
export function SimplifiedInvoiceSheet({ document }: { document: SimplifiedInvoiceDocument }) {
  return (
    <SheetFrame
      sheetKey={document.documentId}
      title={INVOICE_DOCUMENT_TITLES.invoice}
      document={document}
      lead={
        <AmountLead
          label="領収金額"
          amount={document.receipt.receivedAmount}
          note={`ご注文 ${document.orderName} の代金として、上記の金額を正に領収いたしました。`}
        />
      }
      meta={[
        ["取引年月日", formatDocumentDate(document.transactionDate)],
        [receiptDateLabel(document), formatDocumentDate(document.receipt.receivedDate)],
        registrationRow(document),
        ["注文番号", document.orderName],
      ]}
    >
      <StatementSummary document={document} />
      <DetailTable rows={invoiceDetailRows(document)} />
    </SheetFrame>
  );
}

/** 適格返還請求書。領収書は兼ねない */
export function ReturnInvoiceSheet({ document }: { document: ReturnInvoiceDocument }) {
  const hasReducedRate = document.taxSummary.rates.some((rate) => isReducedRate(rate.ratePercent));
  const rows: DetailRow[] = [
    ...document.lines.map((line) => ({
      key: line.lineId,
      description: `${line.description}${line.reducedRate ? " ※" : ""}`,
      quantity: line.quantity,
      amount: line.amount,
    })),
    ...document.otherAmounts.map((item, index) => ({
      key: `other-${index}`,
      description: `${item.description}${item.reducedRate ? " ※" : ""}`,
      quantity: null,
      amount: item.amount,
    })),
  ];

  return (
    <SheetFrame
      sheetKey={document.documentId}
      title={INVOICE_DOCUMENT_TITLES.returnInvoice}
      document={document}
      lead={
        <AmountLead
          label="返還金額"
          amount={document.taxSummary.total}
          note={`ご注文 ${document.orderName} について、下記のとおりご返金いたしました。`}
        />
      }
      meta={[
        ["返還年月日", formatDocumentDate(document.returnDate)],
        ["元の取引年月日", formatDocumentDate(document.originalTransactionDate)],
        registrationRow(document),
        ["注文番号", document.orderName],
      ]}
    >
      <RateSummary document={document} />
      <DetailTable rows={rows} />
      <div className={`mt-[2cqw] ${noteClassName}`}>
        <p>金額はすべて税込です。</p>
        {hasReducedRate ? <p>※は軽減税率（8%）の対象です。</p> : null}
      </div>
    </SheetFrame>
  );
}
