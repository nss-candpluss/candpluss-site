const configuredBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** 末尾スラッシュなし（例: `/test`、未設定時は空文字） */
export function getBasePath(): string {
  return configuredBasePath.replace(/\/$/, "");
}

/** `/` 始まりのパスに basePath を付与する */
export function withBasePath(path: string): string {
  if (!path.startsWith("/")) {
    throw new Error(`Path must start with /: ${path}`);
  }

  return `${getBasePath()}${path}`;
}

/** Contact API の POST 先。静的 `/test` 配信時は NEXT_PUBLIC_CONTACT_API_URL の指定を推奨 */
export function getContactApiUrl(): string {
  const explicitUrl = process.env.NEXT_PUBLIC_CONTACT_API_URL?.trim();

  if (explicitUrl) {
    return explicitUrl;
  }

  return withBasePath("/api/contact");
}
