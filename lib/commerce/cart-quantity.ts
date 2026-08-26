export const CART_QUANTITY_MIN = 1;
export const CART_QUANTITY_MAX = 99;

export function clampCartQuantity(
  raw: string | number,
  fallback: number,
  min = CART_QUANTITY_MIN,
  max = CART_QUANTITY_MAX
) {
  const parsed = typeof raw === "number" ? raw : Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.trunc(parsed)));
}

export function shouldRemoveCartLineOnDecrement(
  quantity: number,
  min = CART_QUANTITY_MIN
) {
  return quantity <= min;
}
