import { getCustomerLogoutUrl } from "@/lib/shopify/customer-account";
import {
  clearCustomerTokenSession,
  getCustomerTokenSession,
} from "@/lib/shopify/customer-session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getCustomerTokenSession();
  await clearCustomerTokenSession();

  try {
    const logoutUrl = await getCustomerLogoutUrl(session?.idToken);
    return Response.redirect(logoutUrl ?? new URL("/", request.url), 303);
  } catch {
    return Response.redirect(new URL("/", request.url), 303);
  }
}
