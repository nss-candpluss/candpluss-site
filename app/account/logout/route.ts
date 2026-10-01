import {
  ACCOUNT_LOGIN_PATH,
  publicOriginFromRequest,
} from "@/lib/commerce/account-login";
import { getCustomerLogoutUrl } from "@/lib/shopify/customer-account";
import {
  clearCustomerTokenSession,
  getCustomerTokenSession,
} from "@/lib/shopify/customer-session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getCustomerTokenSession();
  await clearCustomerTokenSession();
  const origin = publicOriginFromRequest(request.url, request.headers);
  const loginUrl = new URL(ACCOUNT_LOGIN_PATH, origin);

  // Shopify のログアウトは id_token が必須。無いまま送るとエラー画面で止まるので、
  // サイト側のログインだけ消してログインページへ戻す
  if (!session?.idToken) {
    return Response.redirect(loginUrl, 303);
  }

  try {
    const logoutUrl = await getCustomerLogoutUrl(
      session.idToken,
      loginUrl.toString()
    );
    return Response.redirect(logoutUrl ?? loginUrl, 303);
  } catch {
    return Response.redirect(loginUrl, 303);
  }
}
