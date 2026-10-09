import { fetchCustomerAccount } from "@/lib/shopify/customer-account";
import {
  clearCustomerTokenSession,
  getCustomerTokenSession,
  refreshCustomerTokenSession,
} from "@/lib/shopify/customer-session";

export const runtime = "nodejs";

export async function GET() {
  let session = await getCustomerTokenSession();
  if (!session) {
    return Response.json({ customer: null });
  }

  try {
    if (session.expiresAt <= Date.now() + 60_000 && session.refreshToken) {
      session = await refreshCustomerTokenSession(session);
    }

    const customer = await fetchCustomerAccount(session.accessToken);
    return Response.json({ customer });
  } catch {
    await clearCustomerTokenSession();
    return Response.json({ customer: null });
  }
}
