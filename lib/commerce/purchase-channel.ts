/**
 * 購入導線の系統。
 *
 * 第一弾では Shopify 側の設定が追いつかないため公開ページの購入を止めるが、
 * Shopify の購入テストは継続したい。そこで同じ UI をテスト領域にも置き、
 * 購入できるのはテスト領域だけという状態を作る。
 *
 * 判定は URL だけに依存させる。環境変数や cookie で切り替えると、いま見て
 * いる画面が公開ページなのかテスト領域なのかが URL から分からなくなる。
 */
export type PurchaseChannel = "public" | "test";

/** テスト領域のルート。Basic 認証（`proxy.ts`）と robots で保護する */
export const TEST_AREA_ROOT_PATH = "/shopify-test";

/**
 * 公開ページの WEB 購入。第一弾は Shopify 側の設定が追いつかないため止める。
 * 10/2 の販売開始でここを `true` に戻す。テスト領域は影響を受けない。
 */
const PUBLIC_WEB_PURCHASE_ENABLED = false;

export function isWebPurchaseEnabled(channel: PurchaseChannel): boolean {
  return channel === "test" || PUBLIC_WEB_PURCHASE_ENABLED;
}

/** basePath を含まない pathname を渡す（`usePathname()` / `nextUrl.pathname`） */
export function resolvePurchaseChannel(pathname: string): PurchaseChannel {
  if (
    pathname === TEST_AREA_ROOT_PATH ||
    pathname.startsWith(`${TEST_AREA_ROOT_PATH}/`)
  ) {
    return "test";
  }

  return "public";
}

/**
 * テスト領域からのサイト内リンクは同じ領域に留める。
 * 公開ページに戻ると購入できず、テストが途中で切れる。
 */
export function channelPath(channel: PurchaseChannel, path: string): string {
  if (!path.startsWith("/")) {
    throw new Error(`Path must start with /: ${path}`);
  }

  return channel === "test" ? `${TEST_AREA_ROOT_PATH}${path}` : path;
}

/**
 * 発売予定ラベル（`data/product-status-overrides.ts` の直書き）は公開ページ
 * だけに出す。テスト領域は購入できる状態なので、発売前の告知が出ていると
 * 表示と実際の挙動が食い違う。
 */
export function showsStatusDisplayOverride(channel: PurchaseChannel): boolean {
  return channel === "public";
}
