import Link from "next/link";

import { bodyLinkUnderlineClassName } from "@/lib/typography";

const shippingNoticeLines = [
  "※通常、12時までのご注文で当日発送。（休業日を除く・銀行振込はご入金確認後）",
  "※税込合計5,000円以上のお買い上げで送料無料。",
] as const;

type ProductShippingNoticeProps = {
  className?: string;
};

/** ADD TO CART の下に出す発送・送料の案内 */
export function ProductShippingNotice({
  className = "",
}: ProductShippingNoticeProps) {
  return (
    <ul
      className={`font-body-ja text-[clamp(12px,calc(13px*var(--text-scale)),13px)] leading-[clamp(21px,calc(22.75px*var(--text-scale)),22.75px)] text-[var(--color-muted)] ${className}`.trim()}
    >
      {shippingNoticeLines.map((line) => (
        <li key={line}>{line}</li>
      ))}
      <li>
        ※
        <Link href="/support" className={bodyLinkUnderlineClassName}>
          初期不良に関する保証・修理
        </Link>
        について。
      </li>
    </ul>
  );
}
