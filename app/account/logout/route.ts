import { publicOriginFromRequest } from "@/lib/commerce/account-login";
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

  try {
    const logoutUrl = await getCustomerLogoutUrl(
      session?.idToken,
      `${origin}/`
    );
    return Response.redirect(logoutUrl ?? new URL("/", origin), 303);
  } catch {
    return Response.redirect(new URL("/", origin), 303);
  }
}
