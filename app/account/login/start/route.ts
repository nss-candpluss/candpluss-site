import { createHash, randomBytes } from "node:crypto";

import {
  loginHintFromEmail,
  safeAccountReturnTo,
} from "@/lib/commerce/account-login";
import { createCustomerAuthorizationUrl } from "@/lib/shopify/customer-account";
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

  try {
    const state = randomBytes(24).toString("base64url");
    const codeVerifier = randomBytes(48).toString("base64url");
    const codeChallenge = createHash("sha256")
      .update(codeVerifier)
      .digest("base64url");

    const authorizationUrl = await createCustomerAuthorizationUrl({
      state,
      codeChallenge,
      returnTo,
      loginHint,
      locale: "ja",
    });

    await saveCustomerOAuthAttempt({
      state,
      codeVerifier,
      returnTo,
      createdAt: Date.now(),
    });

    return Response.redirect(authorizationUrl);
  } catch {
    const loginUrl = new URL("/account/login", request.url);
    loginUrl.searchParams.set("error", "config");
    if (returnTo !== "/account") {
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
