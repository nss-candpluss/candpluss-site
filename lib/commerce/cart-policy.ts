import { isNonPurchasableStatus } from "@/lib/products/purchase";

export type CartMerchandisePolicy = {
  availableForSale: boolean;
  memberOnly: boolean;
  status?: string | null;
};

export type CartPolicyDenial = {
  ok: false;
  status: 403 | 409;
  error: string;
};

export type CartPolicyDecision = { ok: true } | CartPolicyDenial;

/**
 * カート追加（POST）と数量増加（PATCH）で同じ判定を使う。
 * 減らす・削除は対象外（呼び出し側で分岐する）。
 */
export function evaluateCartMerchandisePolicy(
  policy: CartMerchandisePolicy,
  isAuthenticated: boolean
): CartPolicyDecision {
  if (!policy.availableForSale || isNonPurchasableStatus(policy.status)) {
    return {
      ok: false,
      status: 409,
      error: "This product is not currently available for purchase.",
    };
  }

  if (policy.memberOnly && !isAuthenticated) {
    return {
      ok: false,
      status: 403,
      error: "Customer login is required to purchase this product.",
    };
  }

  return { ok: true };
}
