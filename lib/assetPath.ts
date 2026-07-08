import { getBasePath } from "@/lib/paths";

/** Next.js が自動付与しない CSS 等の静的パス用 */
export function assetPath(path: string): string {
  if (!path.startsWith("/")) {
    return path;
  }

  return `${getBasePath()}${path}`;
}

export { getBasePath, getContactApiUrl, withBasePath } from "@/lib/paths";
