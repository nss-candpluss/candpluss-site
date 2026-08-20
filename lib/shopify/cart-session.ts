import "server-only";

import { cookies } from "next/headers";

import {
  signCookieValue,
  verifySignedCookieValue,
} from "@/lib/security/signed-cookie";

const CART_COOKIE = "cands_cart";

export async function getCartIdFromSession() {
  const cookieStore = await cookies();
  return verifySignedCookieValue(cookieStore.get(CART_COOKIE)?.value);
}

export async function saveCartIdToSession(cartId: string) {
  const cookieStore = await cookies();
  cookieStore.set(CART_COOKIE, signCookieValue(cartId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearCartSession() {
  (await cookies()).delete(CART_COOKIE);
}
