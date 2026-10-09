import {
  ACCOUNT_BASE_PATH,
  ACCOUNT_LOGIN_PATH,
  publicOriginFromRequest,
  safeAccountReturnTo,
} from "@/lib/commerce/account-login";
import {
  clearCustomerTokenSession,
  getCustomerTokenSession,
  refreshCustomerTokenSession,
} from "@/lib/shopify/customer-session";

export const runtime = "nodejs";

/**
 * 会員画面を開いたときにアクセストークンが切れていたら、ここで更新して戻す。
 *
 * 更新できなければ Cookie を消してログインページへ送る。ログインページは
 * 期限内のときしか会員画面へ戻さないので、行き来が続くことはない。
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = publicOriginFromRequest(request.url, request.headers);
  const requested = new URL(
    safeAccountReturnTo(requestUrl.searchParams.get("returnTo")),
    origin
  );
  // `/\host` のような値は別オリジンに解決されるので、解決後のオリジンで確かめる
  const destination =
    requested.origin === new URL(origin).origin
      ? requested
      : new URL(ACCOUNT_BASE_PATH, origin);
  const session = await getCustomerTokenSession();

  if (session && session.expiresAt > Date.now()) {
    return Response.redirect(destination);
  }

  if (session?.refreshToken) {
    try {
      await refreshCustomerTokenSession(session);
      return Response.redirect(destination);
    } catch {
      // 更新トークンも使えないので、ログインし直してもらう
    }
  }

  await clearCustomerTokenSession();

  const loginUrl = new URL(ACCOUNT_LOGIN_PATH, origin);
  const returnTo = `${destination.pathname}${destination.search}`;
  if (returnTo !== ACCOUNT_BASE_PATH) {
    loginUrl.searchParams.set("returnTo", returnTo);
  }
  return Response.redirect(loginUrl);
}
