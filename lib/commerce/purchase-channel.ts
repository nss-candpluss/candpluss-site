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
import { isProductLaunched } from "@/data/product-launch-notices";

export type PurchaseChannel = "public" | "test";

/** テスト領域のルート。Basic 認証（`proxy.ts`）と robots で保護する */
export const TEST_AREA_ROOT_PATH = "/shopify-test";

/**
 * 公開ページの状態。購入・会員・購入テストの注意書きはすべてここから決める。
 * 何度も切り替えるので、フラグを個別に持たず一か所で揃えて動かす。
 *
 * - `prelaunch`: 購入も会員も閉じる。テスト領域だけで購入できる
 * - `purchaseTest`: 公開ページでも購入と会員を開き、両系統に注意書きを出す
 * - `launched`: 公開ページでも購入と会員を開く（10/2 20:00 以降）
 *
 * テスト領域は常に購入・会員とも開いている。
 */
export type PublicSiteMode = "prelaunch" | "purchaseTest" | "launched";

export const PUBLIC_SITE_MODE = "purchaseTest" as PublicSiteMode;

export function isPublicSiteOpen(mode: PublicSiteMode = PUBLIC_SITE_MODE): boolean {
  return mode !== "prelaunch";
}

const PUBLIC_WEB_PURCHASE_ENABLED = isPublicSiteOpen();

export function isWebPurchaseEnabled(channel: PurchaseChannel): boolean {
  return channel === "test" || PUBLIC_WEB_PURCHASE_ENABLED;
}

/**
 * 商品ごとの購入可否。系統が開いていても、発売時期が先の商品
 * （2026年12月・2027年春など）は COMING SOON のまま止める。
 */
export function isProductWebPurchaseEnabled(
  channel: PurchaseChannel,
  handle: string
): boolean {
  return isWebPurchaseEnabled(channel) && isProductLaunched(handle);
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
 * 発売予定ラベル（`data/product-status-overrides.ts` の直書き）は、購入を
 * 止めている公開ページだけに出す。購入できる系統で発売前の告知が出ていると
 * 表示と実際の挙動が食い違う。
 */
export function showsStatusDisplayOverride(
  channel: PurchaseChannel,
  mode: PublicSiteMode = PUBLIC_SITE_MODE
): boolean {
  return channel === "public" && !isPublicSiteOpen(mode);
}
