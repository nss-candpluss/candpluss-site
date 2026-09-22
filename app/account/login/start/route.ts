import { createHash, randomBytes } from "node:crypto";

import {
  ACCOUNT_BASE_PATH,
  ACCOUNT_LOGIN_PATH,
  loginHintFromEmail,
  publicOriginFromRequest,
  safeAccountReturnTo,
} from "@/lib/commerce/account-login";
import {
  createCustomerAuthorizationUrl,
  customerAccountCallbackUrlForRequest,
} from "@/lib/shopify/customer-account";
import { saveCustomerOAuthAttempt } from "@/lib/shopify/customer-session";

export const runtime = "nodejs";

async function startCustomerLogin(request: Request) {
  const requestUrl = new URL(request.url);
  let returnToValue = requestUrl.searchParams.get("returnTo");
  let emailValue = requestUrl.searchParams.get("email");

  if (request.method === "POST") {
    const form = await request.formData();
    const formReturnTo = form.get("returnTo");
    const formEmail = form.get("email");
    if (typeof formReturnTo === "string") {
      returnToValue = formReturnTo;
    }
    if (typeof formEmail === "string") {
      emailValue = formEmail;
    }
  }

  const returnTo = safeAccountReturnTo(returnToValue);
  const loginHint = loginHintFromEmail(emailValue);
  const origin = publicOriginFromRequest(request.url, request.headers);

  try {
    const state = randomBytes(24).toString("base64url");
    const codeVerifier = randomBytes(48).toString("base64url");
    const codeChallenge = createHash("sha256")
      .update(codeVerifier)
      .digest("base64url");
    const callbackUrl = customerAccountCallbackUrlForRequest(request);

    const authorizationUrl = await createCustomerAuthorizationUrl({
      state,
      codeChallenge,
      returnTo,
      loginHint,
      locale: "ja",
      callbackUrl,
    });

    await saveCustomerOAuthAttempt({
      state,
      codeVerifier,
      returnTo,
      createdAt: Date.now(),
      callbackUrl,
    });

    return Response.redirect(authorizationUrl);
  } catch {
    const loginUrl = new URL(ACCOUNT_LOGIN_PATH, origin);
    loginUrl.searchParams.set("error", "config");
    if (returnTo !== ACCOUNT_BASE_PATH) {
      loginUrl.searchParams.set("returnTo", returnTo);
    }
    return Response.redirect(loginUrl, 303);
  }
}

export function GET(request: Request) {
  return startCustomerLogin(request);
}

export function POST(request: Request) {
  return startCustomerLogin(request);
}
