/**
 * 商品詳細の ADD TO CART ボタン表示制御。
 * Shopify カート連携実装後は button: true に戻す。
 */
export const productAddToCartVisibility = {
  button: false,
} as const;

export function isAddToCartButtonVisible(): boolean {
  return productAddToCartVisibility.button;
}
