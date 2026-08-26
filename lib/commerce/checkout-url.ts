export function shopifyCheckoutUrl(url: string, isLoggedIn: boolean) {
  if (!isLoggedIn) {
    return url;
  }

  const checkout = new URL(url);
  checkout.searchParams.set("sso", "silent");
  return checkout.toString();
}
