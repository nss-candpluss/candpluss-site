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

/**
 * ログインの案内ページ。
 *
 * Shopify のサインイン画面は自前の画面に置き換えられず、メールアドレスも
 * そちらで入力する。同じ入力を二度させないため、通常のログインはこのページを
 * 通さず `ACCOUNT_LOGIN_START_PATH` から直接 Shopify へ送る。
 * ここはログイン設定の不備を知らせる受け皿として残している。
 */
export const ACCOUNT_LOGIN_PATH = `${ACCOUNT_BASE_PATH}/login`;

/** OAuth を開始するルートハンドラ。Shopify のサインイン画面へ転送する */
export const ACCOUNT_LOGIN_START_PATH = "/account/login/start";

/** 注文ごとの領収書。対象の注文は `order` クエリで渡す */
export const ACCOUNT_RECEIPT_PATH = `${ACCOUNT_BASE_PATH}/receipt`;

export function accountReceiptHref(orderId: string) {
  return `${ACCOUNT_RECEIPT_PATH}?order=${encodeURIComponent(orderId)}`;
}

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

/**
 * ngrok 経由では request.url が localhost のままになる。
 * 公開ホストは X-Forwarded-* を優先する。
 */
export function publicOriginFromRequest(
  requestUrl: string | URL,
  requestHeaders?: Headers
) {
  const url = typeof requestUrl === "string" ? new URL(requestUrl) : requestUrl;
  const host =
    requestHeaders?.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    requestHeaders?.get("host")?.split(",")[0]?.trim() ||
    url.host;
  const protocol =
    requestHeaders?.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
    url.protocol.replace(/:$/, "");

  return `${protocol}://${host}`;
}

/**
 * 本番以外（localhost / ngrok など）では、ログイン Cookie と同じオリジンへ戻す。
 * 本番ホストのときは Shopify に登録済みのコールバック URL を使う。
 */
export function resolveCustomerAccountCallbackUrl(
  configuredCallbackUrl: string,
  requestUrl: string | URL,
  requestHeaders?: Headers
) {
  const configured = new URL(configuredCallbackUrl);
  const origin = new URL(publicOriginFromRequest(requestUrl, requestHeaders));

  if (origin.hostname === configured.hostname) {
    return configuredCallbackUrl;
  }

  return `${origin.origin}/account/authorize`;
}
