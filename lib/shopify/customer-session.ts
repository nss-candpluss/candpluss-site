import "server-only";

import { cookies } from "next/headers";

import {
  decryptSession,
  encryptSession,
} from "@/lib/security/encrypted-session";
import type { CustomerTokenSession } from "@/lib/shopify/customer-account";

const CUSTOMER_SESSION_COOKIE = "cands_customer";
const CUSTOMER_OAUTH_COOKIE = "cands_customer_oauth";

export type CustomerOAuthAttempt = {
  state: string;
  codeVerifier: string;
  returnTo: string;
  createdAt: number;
};

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export async function getCustomerTokenSession() {
  const cookieStore = await cookies();
  return decryptSession<CustomerTokenSession>(
    cookieStore.get(CUSTOMER_SESSION_COOKIE)?.value
  );
}

export async function saveCustomerTokenSession(session: CustomerTokenSession) {
  const cookieStore = await cookies();
  cookieStore.set(CUSTOMER_SESSION_COOKIE, encryptSession(session), {
    ...cookieOptions,
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearCustomerTokenSession() {
  (await cookies()).delete(CUSTOMER_SESSION_COOKIE);
}

export async function saveCustomerOAuthAttempt(attempt: CustomerOAuthAttempt) {
  const cookieStore = await cookies();
  cookieStore.set(CUSTOMER_OAUTH_COOKIE, encryptSession(attempt), {
    ...cookieOptions,
    maxAge: 60 * 10,
  });
}

export async function consumeCustomerOAuthAttempt() {
  const cookieStore = await cookies();
  const attempt = decryptSession<CustomerOAuthAttempt>(
    cookieStore.get(CUSTOMER_OAUTH_COOKIE)?.value
  );
  cookieStore.delete(CUSTOMER_OAUTH_COOKIE);
  return attempt;
}
