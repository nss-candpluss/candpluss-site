import type { PurchaseChannel } from "@/lib/commerce/purchase-channel";

/** 購入テスト中に ADD TO CART の下へ出す注意書き */
export const purchaseTestNotice =
  "【注意】 現在、WEBサイトの購入テスト中です。一時的に購入可能となっておりますが、テスト中にご注文いただいた商品に関しては正式注文とはならないため、キャンセル処理をさせていただきます。";

/** 注意書きを出すチャネル。公開ページで購入テストをする間だけ "public" を加える */
export const purchaseTestNoticeChannels: readonly PurchaseChannel[] = ["test"];
