import { productLaunchNoticeByHandle } from "@/data/product-launch-notices";

type ProductComingSoonNoticeProps = {
  handle: string;
  /** 差し替え前の ADD TO CART と同じ「¥」抜きの金額文字列 */
  priceAmount: string;
  showPrice: boolean;
  /** 外側の余白。ADD TO CART と同じ寸法を呼び出し側から渡す */
  className?: string;
  noticeClassName?: string;
  priceClassName?: string;
};

/**
 * 購入停止中に ADD TO CART の代わりに出す告知枠。左に販売開始時期、右に価格。
 *
 * 押せる要素ではないので `button` ではなく `p` で組む。`disabled` なボタンに
 * すると支援技術には「押せるが今は無効」と伝わるうえ、10/2 の販売開始で
 * 本物のボタンに戻すときの差分も読みにくくなる。
 */
export function ProductComingSoonNotice({
  handle,
  priceAmount,
  showPrice,
  className = "",
  noticeClassName = "",
  priceClassName = "",
}: ProductComingSoonNoticeProps) {
  const notice = productLaunchNoticeByHandle[handle];

  // 販売開始時期も価格も無い商品では、中身の無い赤帯だけが残ってしまう
  if (!notice && !showPrice) {
    return null;
  }

  return (
    <p
      className={`flex w-full flex-wrap items-center justify-between gap-x-[clamp(12px,calc(16px*var(--gap-scale-x)),16px)] gap-y-[10px] bg-[#c40000] text-white ${className}`.trim()}
    >
      {notice ? (
        <span
          className={`font-body-ja font-bold whitespace-nowrap ${noticeClassName}`.trim()}
        >
          {notice}
        </span>
      ) : null}
      {showPrice ? (
        <span
          className={`inline-flex items-baseline gap-[4px] font-ui-en ${priceClassName}`.trim()}
        >
          <span>¥{priceAmount}</span>
          <span className="font-body-ja text-[11px] leading-[11px]">税込</span>
        </span>
      ) : null}
    </p>
  );
}
