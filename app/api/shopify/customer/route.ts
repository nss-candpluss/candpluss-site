import {
  fetchCustomerAccount,
  refreshCustomerToken,
} from "@/lib/shopify/customer-account";
import {
  clearCustomerTokenSession,
  getCustomerTokenSession,
  saveCustomerTokenSession,
} from "@/lib/shopify/customer-session";

export const runtime = "nodejs";

export async function GET() {
  let session = await getCustomerTokenSession();
  if (!session) {
    return Response.json({ customer: null });
  }

  try {
    if (session.expiresAt <= Date.now() + 60_000 && session.refreshToken) {
      const refreshed = await refreshCustomerToken(session.refreshToken);

      // 更新の応答には id_token が付かないことがある。ログアウトにはログイン時の
      // id_token が要るので、新しいものが無ければ手元のものを引き継ぐ
      session = {
        ...refreshed,
        refreshToken: refreshed.refreshToken ?? session.refreshToken,
        idToken: refreshed.idToken ?? session.idToken,
      };
      await saveCustomerTokenSession(session);
    }

    const customer = await fetchCustomerAccount(session.accessToken);
    return Response.json({ customer });
  } catch {
    await clearCustomerTokenSession();
    return Response.json({ customer: null });
  }
}
