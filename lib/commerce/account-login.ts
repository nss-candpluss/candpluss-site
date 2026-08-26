export function safeAccountReturnTo(value: string | null | undefined) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/account";
}

export function loginHintFromEmail(value: string | null | undefined) {
  const email = value?.trim() ?? "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return undefined;
  }
  return email;
}
