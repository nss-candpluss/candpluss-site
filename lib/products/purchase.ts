import type { Product } from "@/types/product";

/**
 * 購入できないステータス。
 *
 * 型は `Product["status"]` で受けて書き間違いを防ぎつつ、参照側は
 * `ReadonlySet<string>` として扱う。カート API は Shopify のメタフィールドから
 * 生の文字列を受け取るため、判定を二重定義せずここに集約する。
 *
 * NEW 表示は sales_status ではなく `custom.is_new`（true / false）が担うため、
 * `new` は購入可否に一切関与しない。ここに入れると「NEW にすると売れない」と
 * 誤解される。
 */
const NON_PURCHASABLE_STATUSES: ReadonlySet<string> = new Set<Product["status"]>([
  "comingSoon",
  "waiting",
  "ended",
  "soldOut",
  "discontinued",
]);

/** Shopify から来る生の status 文字列にも使える判定（カート API 用） */
export function isNonPurchasableStatus(status?: string | null): boolean {
  return status ? NON_PURCHASABLE_STATUSES.has(status) : false;
}

/**
 * Shopify の member_only メタフィールドが未登録なら「会員限定ではない」として扱う。
 * 以前は未登録を購入不可（fail-closed）としていたため、先方が未登録の間は
 * 全商品がカートに入れられない状態になっていた。
 * 会員限定にしたい商品は member_only を true で登録する運用とする。
 */
export function canPurchaseProduct(
  product: Product,
  isAuthenticated: boolean
) {
  if (isNonPurchasableStatus(product.status)) {
    return false;
  }

  return product.memberAccess !== "memberOnly" || isAuthenticated;
}
