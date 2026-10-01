import {
  RECEIPT_DOCUMENT_TITLE,
  RECEIPT_MIN_DETAIL_ROWS,
  RECEIPT_TAX_RATE_PERCENT,
  receiptIssuer,
} from "@/data/receipt";

export type ReceiptSheetLine = {
  id: string;
  description: string;
  quantity: number;
  amount: number;
};

export type ReceiptSheetProps = {
  recipientName: string;
  issuedAt: string;
  orderName: string;
  /** 未登録なら行ごと出さない（適格請求書として扱わない） */
  registrationNumber: string | null;
  /** 商品の税抜合計 */
  subtotalExcludingTax: number;
  shippingExcludingTax: number;
  tax: number;
  total: number;
  lines: ReceiptSheetLine[];
};

function formatYen(value: number) {
  return Math.round(value).toLocaleString("ja-JP");
}

function formatIssuedAt(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "long",
    timeZone: "Asia/Tokyo",
  }).format(new Date(value));
}

/*
  寸法はすべて用紙の幅に対する割合（cqw）で持つ。
  紙の書類なので、画面幅で文字だけが縮む Text Scale には乗せず、
  スマホでも PDF でも同じ比率のまま縮める。基準は幅 620px のデザイン。
  A4（余白 12mm）の縦横比 1.468 を超えると 2 枚目に溢れるので、行を足すときは高さを確かめる。
*/
const cellClassName = "border border-[#333] px-[1.9cqw]";
const summaryHeadClassName = `${cellClassName} h-[3.9cqw] text-center text-[1.6cqw] leading-none font-normal`;
const summaryValueClassName = `${cellClassName} h-[6.6cqw] text-right text-[1.6cqw] leading-none`;
const detailHeadClassName = `${cellClassName} h-[4cqw] text-center text-[1.6cqw] leading-none font-normal`;
const detailCellClassName = `${cellClassName} h-[4.7cqw] text-[1.6cqw] leading-none`;
const metaRowClassName = "grid grid-cols-[13.4cqw_auto] text-[1.6cqw] leading-[2.75cqw]";

export function ReceiptSheet({
  recipientName,
  issuedAt,
  orderName,
  registrationNumber,
  subtotalExcludingTax,
  shippingExcludingTax,
  tax,
  total,
  lines,
}: ReceiptSheetProps) {
  const blankRowCount = Math.max(0, RECEIPT_MIN_DETAIL_ROWS - lines.length);

  return (
    <div className="@container">
      <article
        data-receipt-sheet
        className="bg-white font-body-ja text-[var(--foreground)]"
      >
        <h1 className="text-center font-body-ja text-[4.5cqw] leading-none font-normal">
          {RECEIPT_DOCUMENT_TITLE}
        </h1>

        <div className="mt-[9.5cqw] flex items-start justify-between gap-[4cqw]">
          <p className="min-w-0 text-[2.26cqw] leading-[2.75cqw]">
            {recipientName ? `${recipientName} 様` : "様"}
          </p>

          <div className="shrink-0">
            <dl>
              <div className={metaRowClassName}>
                <dt>発行日</dt>
                <dd>{formatIssuedAt(issuedAt)}</dd>
              </div>
              {registrationNumber ? (
                <div className={metaRowClassName}>
                  <dt>登録番号</dt>
                  <dd>{registrationNumber}</dd>
                </div>
              ) : null}
              <div className={metaRowClassName}>
                <dt>注文番号</dt>
                <dd>{orderName}</dd>
              </div>
            </dl>

            <div className="mt-[2.75cqw] text-[1.6cqw] leading-[2.75cqw]">
              <p>{receiptIssuer.brandName}</p>
              <p>TEL：{receiptIssuer.tel}</p>
              <p className="mt-[2.75cqw]">運営：{receiptIssuer.name}</p>
              <p>{receiptIssuer.postalCode}</p>
              <p>{receiptIssuer.address}</p>
            </div>
          </div>
        </div>

        <table className="mt-[3.9cqw] w-[69.2%] table-fixed border-collapse">
          <thead>
            <tr>
              <th className={summaryHeadClassName}>税抜合計</th>
              <th className={summaryHeadClassName}>送料（税抜）</th>
              <th className={summaryHeadClassName}>
                消費税 ({RECEIPT_TAX_RATE_PERCENT}%)
              </th>
              <th className={summaryHeadClassName}>合計金額</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={summaryValueClassName}>{formatYen(subtotalExcludingTax)} 円</td>
              <td className={summaryValueClassName}>{formatYen(shippingExcludingTax)} 円</td>
              <td className={summaryValueClassName}>{formatYen(tax)} 円</td>
              <td className={`${summaryValueClassName} text-[1.8cqw] font-semibold`}>
                {formatYen(total)} 円
              </td>
            </tr>
          </tbody>
        </table>

        <table className="mt-[4.4cqw] w-full table-fixed border-collapse">
          <colgroup>
            <col className="w-[61.1%]" />
            <col className="w-[16.6%]" />
            <col className="w-[22.3%]" />
          </colgroup>
          <thead>
            <tr>
              <th className={detailHeadClassName}>摘要</th>
              <th className={detailHeadClassName}>数量</th>
              <th className={detailHeadClassName}>税込金額</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <tr key={line.id} className="break-inside-avoid">
                <td className={`${detailCellClassName} text-left`}>
                  {line.description}
                </td>
                <td className={`${detailCellClassName} text-center`}>
                  {line.quantity}
                </td>
                <td className={`${detailCellClassName} text-right`}>
                  {formatYen(line.amount)}
                </td>
              </tr>
            ))}
            {Array.from({ length: blankRowCount }, (_, index) => (
              <tr key={`blank-${index}`} aria-hidden="true">
                <td className={detailCellClassName} />
                <td className={detailCellClassName} />
                <td className={detailCellClassName} />
              </tr>
            ))}
          </tbody>
        </table>
      </article>
    </div>
  );
}
