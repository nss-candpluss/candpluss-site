import type { ReactNode } from "react";

import { receiptIssuer } from "@/data/receipt";
import {
  INVOICE_DOCUMENT_TITLES,
  type InvoiceDocument,
  type ReturnInvoiceDocument,
  type SimplifiedInvoiceDocument,
} from "@/lib/invoice/documents";
import { isReducedRate } from "@/lib/invoice/tax";

/*
  寸法は用紙の幅に対する割合（cqw）で持つ。A4（余白 12mm）では 1cqw ≒ 1.86mm ≒ 5.3pt。
  画面では 1 枚に続けて出し、A4 に収まらない分は PDF・印刷で明細の行の切れ目から次のページに送る
  （`lib/commerce/receipt-pdf.ts`）。文字は縮めないので、明細より上は 1 ページ目に収める。
  PDF は罫線と文字だけを描き直すので、背景色や影は使わない（画面と PDF で見え方が変わる）。
  税率ごとの金額・消費税額・合計は書類（`lib/invoice/documents.ts`）の値をそのまま出し、ここでは計算しない。
*/
const RULE_STRONG = "border-[#333]";
const RULE_LIGHT = "border-[#c4c4c4]";
const textClassName = "text-[1.7cqw] leading-[1.6]";
const noteClassName = "text-[1.45cqw] leading-[1.6]";
const headCellClassName = `border-y ${RULE_STRONG} px-[1.2cqw] h-[4.2cqw] text-[1.5cqw] leading-none font-normal`;
// 長い商品名は折り返す。1 行の行は 4.4cqw、折り返した行は上下に余白を持って高くなる
const bodyCellClassName = `border-b ${RULE_LIGHT} px-[1.2cqw] h-[4.4cqw] py-[0.7cqw] text-[1.6cqw] leading-[1.35]`;
// Tailwind が読み取れるよう、クラス名は組み立てずにそのまま書く
const lastRowClassName = "[&>tr:last-child>td]:border-[#333]";

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
  reducedRate: boolean;
  quantity: number | null;
  unitPrice: number | null;
  amount: number;
  /** 割引のように、直前の行に付く行。字下げして示し、PDF でも同じページに置く */
  attachedToPrevious?: boolean;
};

function MetaList({ rows }: { rows: [string, string][] }) {
  return (
    <dl className={textClassName}>
      {rows.map(([term, value]) => (
        <div key={term} className="grid grid-cols-[14cqw_auto]">
          <dt>{term}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** 発行事業者。登録番号は事業者名と並べて示す */
function IssuerBlock({ document }: { document: InvoiceDocument }) {
  return (
    <div className={`mt-[3cqw] border-t ${RULE_LIGHT} pt-[2cqw] ${textClassName}`}>
      {document.issuer.brandName ? <p>{document.issuer.brandName}</p> : null}
      <p>{document.issuer.name}</p>
      <p>
        {receiptIssuer.postalCode} {receiptIssuer.address}
      </p>
      <p>TEL {receiptIssuer.tel}</p>
      <p className="mt-[0.8cqw]">登録番号 {document.issuer.registrationNumber}</p>
    </div>
  );
}

function AmountLead({
  label,
  document,
  note,
}: {
  label: string;
  document: InvoiceDocument;
  note: string;
}) {
  const amount = document.kind === "invoice" ? document.receipt.receivedAmount : document.taxSummary.total;

  return (
    <div>
      <p className={textClassName}>{label}</p>
      <p
        className={`mt-[1cqw] flex max-w-[48cqw] items-baseline justify-between gap-[2cqw] border-b ${RULE_STRONG} pb-[1cqw]`}
      >
        <span className="text-[3.6cqw] leading-none font-semibold">¥{yenText(amount)}</span>
        <span className="text-[1.5cqw] leading-none">（税込）</span>
      </p>
      <p className={`mt-[1cqw] ${textClassName}`}>うち消費税額 {yenText(document.taxSummary.tax)}円</p>
      <p className="mt-[2cqw] text-[1.5cqw] leading-[1.6]">{note}</p>
    </div>
  );
}

function DetailTable({
  rows,
  withUnitPrice,
  itemLabel,
}: {
  rows: DetailRow[];
  withUnitPrice: boolean;
  itemLabel: string;
}) {
  return (
    <table data-receipt-detail className="mt-[6cqw] w-full table-fixed border-collapse">
      <colgroup>
        <col />
        <col className="w-[10cqw]" />
        {withUnitPrice ? <col className="w-[15cqw]" /> : null}
        <col className="w-[17cqw]" />
      </colgroup>
      <thead>
        <tr>
          <th className={`${headCellClassName} text-left`}>{itemLabel}</th>
          <th className={`${headCellClassName} text-right`}>数量</th>
          {withUnitPrice ? <th className={`${headCellClassName} text-right`}>単価</th> : null}
          <th className={`${headCellClassName} text-right`}>金額</th>
        </tr>
      </thead>
      <tbody className={lastRowClassName}>
        {rows.map((row) => (
          <tr
            key={row.key}
            data-receipt-keep-with-previous={row.attachedToPrevious || undefined}
            className="break-inside-avoid"
          >
            <td className={`${bodyCellClassName} text-left ${row.attachedToPrevious ? "pl-[3.2cqw]" : ""}`}>
              {row.description}
              {row.reducedRate ? " ※" : ""}
            </td>
            <td className={`${bodyCellClassName} text-right`}>{row.quantity ?? ""}</td>
            {withUnitPrice ? (
              <td className={`${bodyCellClassName} text-right`}>
                {row.unitPrice === null ? "" : yenText(row.unitPrice)}
              </td>
            ) : null}
            <td className={`${bodyCellClassName} text-right`}>{yenText(row.amount)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** 税率ごとの対象金額（税込）と消費税額。明細の下、金額の列にそろえて右に置く */
function RateSummary({ document, amountLabel }: { document: InvoiceDocument; amountLabel: string }) {
  const hasReducedRate = document.taxSummary.rates.some((rate) => isReducedRate(rate.ratePercent));

  return (
    <div className="mt-[3cqw] flex break-inside-avoid flex-col items-end">
      <table data-receipt-summary className="w-[62cqw] table-fixed border-collapse">
        <colgroup>
          <col />
          <col className="w-[20cqw]" />
          <col className="w-[17cqw]" />
        </colgroup>
        <thead>
          <tr>
            <th className={`${headCellClassName} text-left`}>税率区分</th>
            <th className={`${headCellClassName} text-right`}>{amountLabel}</th>
            <th className={`${headCellClassName} text-right`}>消費税額</th>
          </tr>
        </thead>
        <tbody>
          {document.taxSummary.rates.map((rate) => (
            <tr key={rate.ratePercent}>
              <td className={`${bodyCellClassName} text-left`}>
                {rateLabel(rate.ratePercent, isReducedRate(rate.ratePercent))}
              </td>
              <td className={`${bodyCellClassName} text-right`}>{yenText(rate.totalIncludingTax)}円</td>
              <td className={`${bodyCellClassName} text-right`}>{yenText(rate.tax)}円</td>
            </tr>
          ))}
          <tr>
            <td className={`${bodyCellClassName} border-b-[#333] text-left font-semibold`}>合計</td>
            <td className={`${bodyCellClassName} border-b-[#333] text-right font-semibold`}>
              {yenText(document.taxSummary.total)}円
            </td>
            <td className={`${bodyCellClassName} border-b-[#333] text-right font-semibold`}>
              {yenText(document.taxSummary.tax)}円
            </td>
          </tr>
        </tbody>
      </table>

      <div className={`mt-[1.6cqw] w-[62cqw] ${noteClassName}`}>
        <p>金額はすべて税込です。</p>
        {hasReducedRate ? <p>※は軽減税率（8%）の対象です。</p> : null}
      </div>
    </div>
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
        className="bg-white font-body-ja text-[#111]"
      >
        <h1 className="text-center font-body-ja text-[3.2cqw] leading-none font-semibold">{title}</h1>

        <div className="mt-[7cqw] flex items-start justify-between gap-[6cqw]">
          <div className="min-w-0 flex-1">{lead}</div>
          <div className="w-[40cqw] shrink-0">
            <MetaList rows={meta} />
            <IssuerBlock document={document} />
          </div>
        </div>

        {children}
      </article>
    </div>
  );
}

/**
 * 領収書の欄の日付の見出し。Shopify の決済の記録の日で、実際にお金が届いた日とは限らない。
 * 銀行振込などの手動の決済は、当店が入金を確認して登録した日になる
 */
export function receiptDateLabel(document: SimplifiedInvoiceDocument) {
  return document.receipt.manualPayment ? "入金確認日" : "決済日";
}

/** 明細の行。割引は商品の直後に、請求額 0 円の送料は出さない（書類の記録には残る） */
export function invoiceDetailRows(document: SimplifiedInvoiceDocument): DetailRow[] {
  const rows: DetailRow[] = document.lines.flatMap((line) => [
    {
      key: line.lineId,
      description: line.description,
      reducedRate: line.reducedRate,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      amount: line.unitPrice * line.quantity,
    },
    ...(line.discount > 0
      ? [
          {
            key: `${line.lineId}:discount`,
            description: "└ 割引",
            reducedRate: false,
            quantity: null,
            unitPrice: null,
            amount: -line.discount,
            attachedToPrevious: true,
          },
        ]
      : []),
  ]);

  if (document.shipping && document.shipping.amount > 0) {
    rows.push({
      key: "shipping",
      description: `送料（${document.shipping.title}）`,
      reducedRate: document.shipping.reducedRate,
      quantity: null,
      unitPrice: null,
      amount: document.shipping.price,
    });
    if (document.shipping.discount > 0) {
      rows.push({
        key: "shipping:discount",
        description: "└ 送料の割引",
        reducedRate: false,
        quantity: null,
        unitPrice: null,
        amount: -document.shipping.discount,
        attachedToPrevious: true,
      });
    }
  }

  return rows;
}

/** 領収書 兼 適格簡易請求書。小売業の適格簡易請求書なので、宛名・発行日は載せない */
export function SimplifiedInvoiceSheet({ document }: { document: SimplifiedInvoiceDocument }) {
  return (
    <SheetFrame
      sheetKey={document.documentId}
      title={INVOICE_DOCUMENT_TITLES.invoice}
      document={document}
      lead={
        <AmountLead
          label="領収金額"
          document={document}
          note={`ご注文 ${document.orderName} の代金として、上記の金額を正に領収いたしました。`}
        />
      }
      meta={[
        ["取引年月日", formatDocumentDate(document.transactionDate)],
        [receiptDateLabel(document), formatDocumentDate(document.receipt.receivedDate)],
        ["注文番号", document.orderName],
      ]}
    >
      <DetailTable rows={invoiceDetailRows(document)} withUnitPrice itemLabel="品名" />
      <RateSummary document={document} amountLabel="対象金額（税込）" />
    </SheetFrame>
  );
}

/** 適格返還請求書。領収書は兼ねない */
export function ReturnInvoiceSheet({ document }: { document: ReturnInvoiceDocument }) {
  const rows: DetailRow[] = [
    ...document.lines.map((line) => ({
      key: line.lineId,
      description: line.description,
      reducedRate: line.reducedRate,
      quantity: line.quantity,
      unitPrice: null,
      amount: line.amount,
    })),
    ...document.otherAmounts.map((item, index) => ({
      key: `other-${index}`,
      description: item.description,
      reducedRate: item.reducedRate,
      quantity: null,
      unitPrice: null,
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
          document={document}
          note={`ご注文 ${document.orderName} について、下記のとおりご返金いたしました。`}
        />
      }
      meta={[
        ["返還年月日", formatDocumentDate(document.returnDate)],
        ["元の取引年月日", formatDocumentDate(document.originalTransactionDate)],
        ["注文番号", document.orderName],
      ]}
    >
      <DetailTable rows={rows} withUnitPrice={false} itemLabel="内容" />
      <RateSummary document={document} amountLabel="返還金額（税込）" />
    </SheetFrame>
  );
}
