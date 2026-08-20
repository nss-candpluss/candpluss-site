import { exchangeCustomerAuthorizationCode } from "@/lib/shopify/customer-account";
import { updateCartBuyerIdentity } from "@/lib/shopify/cart";
import { getCartIdFromSession } from "@/lib/shopify/cart-session";
import {
  consumeCustomerOAuthAttempt,
  saveCustomerTokenSession,
} from "@/lib/shopify/customer-session";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  const attempt = await consumeCustomerOAuthAttempt();

  if (
    !code ||
    !state ||
    !attempt ||
    attempt.state !== state ||
    Date.now() - attempt.createdAt > 10 * 60 * 1000
  ) {
    return Response.redirect(new URL("/account?error=invalid_state", request.url));
  }

  try {
    const session = await exchangeCustomerAuthorizationCode(
      code,
      attempt.codeVerifier
    );
    await saveCustomerTokenSession(session);
    const cartId = await getCartIdFromSession();
    if (cartId) {
      const buyerIp =
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip");
      await updateCartBuyerIdentity(
        cartId,
        session.accessToken,
        buyerIp
      ).catch(() => undefined);
    }
    return Response.redirect(new URL(attempt.returnTo, request.url));
  } catch {
    return Response.redirect(new URL("/account?error=token_exchange", request.url));
  }
}
