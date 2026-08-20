import { createHash, randomBytes } from "node:crypto";

import { createCustomerAuthorizationUrl } from "@/lib/shopify/customer-account";
import { saveCustomerOAuthAttempt } from "@/lib/shopify/customer-session";

export const runtime = "nodejs";

function safeReturnTo(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/account";
}

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const returnTo = safeReturnTo(requestUrl.searchParams.get("returnTo"));
    const state = randomBytes(24).toString("base64url");
    const codeVerifier = randomBytes(48).toString("base64url");
    const codeChallenge = createHash("sha256")
      .update(codeVerifier)
      .digest("base64url");

    await saveCustomerOAuthAttempt({
      state,
      codeVerifier,
      returnTo,
      createdAt: Date.now(),
    });

    const authorizationUrl = await createCustomerAuthorizationUrl({
      state,
      codeChallenge,
      returnTo,
    });

    return Response.redirect(authorizationUrl);
  } catch {
    return Response.json(
      { error: "Customer Account API is not configured." },
      { status: 503 }
    );
  }
}
