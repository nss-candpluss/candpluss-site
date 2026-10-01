import {
  purchaseTestNotice,
  purchaseTestNoticeChannels,
} from "@/data/purchase-test-notice";
import type { PurchaseChannel } from "@/lib/commerce/purchase-channel";
import { bodyText } from "@/lib/typography";

type ProductPurchaseTestNoticeProps = {
  channel: PurchaseChannel;
  className?: string;
};

/** 購入テスト中、ADD TO CART の下に出す赤字の注意書き */
export function ProductPurchaseTestNotice({
  channel,
  className = "",
}: ProductPurchaseTestNoticeProps) {
  if (!purchaseTestNoticeChannels().includes(channel)) {
    return null;
  }

  return (
    <p
      className={`font-body-ja font-bold text-[#c40000] ${bodyText(13)} ${className}`.trim()}
    >
      {purchaseTestNotice}
    </p>
  );
}
