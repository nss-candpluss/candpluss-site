import "server-only";

import { cookies } from "next/headers";

import {
  decryptSession,
  encryptSession,
} from "@/lib/security/encrypted-session";
import {
  refreshCustomerToken,
  type CustomerTokenSession,
} from "@/lib/shopify/customer-account";

const CUSTOMER_SESSION_COOKIE = "cands_customer";
const CUSTOMER_OAUTH_COOKIE = "cands_customer_oauth";

export type CustomerOAuthAttempt = {
  state: string;
  codeVerifier: string;
  returnTo: string;
  createdAt: number;
  callbackUrl?: string;
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

/** 期限切れは未ログインとして扱う。Server Component からも使う */
export async function getLiveCustomerTokenSession() {
  const session = await getCustomerTokenSession();

  return session && session.expiresAt > Date.now() ? session : null;
}

/**
 * 期限は切れているが、更新トークンで延ばせる状態。
 * Cookie は 30 日残るのに対し、アクセストークンは短時間で切れる。
 */
export async function hasRefreshableCustomerTokenSession() {
  const session = await getCustomerTokenSession();

  return Boolean(session?.refreshToken && session.expiresAt <= Date.now());
}

/** Route Handler からだけ呼ぶ。Cookie を書き換える */
export async function refreshCustomerTokenSession(
  session: CustomerTokenSession
) {
  if (!session.refreshToken) {
    throw new Error("Customer refresh token is missing.");
  }

  const refreshed = await refreshCustomerToken(session.refreshToken);
  // 更新の応答には id_token が付かないことがある。ログアウトにはログイン時の
  // id_token が要るので、新しいものが無ければ手元のものを引き継ぐ
  const next: CustomerTokenSession = {
    ...refreshed,
    refreshToken: refreshed.refreshToken ?? session.refreshToken,
    idToken: refreshed.idToken ?? session.idToken,
  };

  await saveCustomerTokenSession(next);
  return next;
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
