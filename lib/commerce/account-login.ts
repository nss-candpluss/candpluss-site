import {
  TEST_AREA_ROOT_PATH,
  type PurchaseChannel,
} from "@/lib/commerce/purchase-channel";

/**
 * 公開ページの会員機能。
 *
 * 会員機能は購入の再開（`PUBLIC_WEB_PURCHASE_ENABLED`）とは別のタイミングで
 * 先行リリースする。準備ができたらここだけを `true` にすれば、公開ページの
 * `/account` が開き、ヘッダーのユーザーアイコンも出る。
 */
const PUBLIC_ACCOUNT_ENABLED = false;

export function isAccountEnabled(channel: PurchaseChannel): boolean {
  return channel === "test" || PUBLIC_ACCOUNT_ENABLED;
}

/**
 * 会員画面の置き場所。リリース前はテスト領域だけに置く。
 *
 * OAuth のコールバック（`/account/authorize`）は Shopify 側の設定と固定で
 * 紐づくためルートハンドラとして常に `/account` 配下に残し、画面の行き先だけを
 * ここで一元管理する。
 */
export const ACCOUNT_BASE_PATH = PUBLIC_ACCOUNT_ENABLED
  ? "/account"
  : `${TEST_AREA_ROOT_PATH}/account`;
export const ACCOUNT_LOGIN_PATH = `${ACCOUNT_BASE_PATH}/login`;

export function safeAccountReturnTo(value: string | null | undefined) {
  return value?.startsWith("/") && !value.startsWith("//")
    ? value
    : ACCOUNT_BASE_PATH;
}

export function loginHintFromEmail(value: string | null | undefined) {
  const email = value?.trim() ?? "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return undefined;
  }
  return email;
}
