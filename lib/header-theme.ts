export type HeaderTheme = "onDark" | "onLight";

export const HEADER_THEME_PROBE_Y = 40;

/** ページ先頭がダーク Hero のルート。ヘッダーは document 先頭の absolute なので、ここ以外はライトが既定 */
export const DARK_TOP_HEADER_PATHS = new Set([
  "/",
  "/concept",
  "/labo",
  "/support",
]);

export function isProductDetailPath(pathname: string): boolean {
  return /^\/products\/[^/]+$/.test(normalizePathname(pathname));
}

export function normalizePathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname || "/";
}

export function fallbackHeaderTheme(pathname: string): HeaderTheme {
  if (isProductDetailPath(pathname)) {
    return "onLight";
  }

  return DARK_TOP_HEADER_PATHS.has(normalizePathname(pathname)) ? "onDark" : "onLight";
}

export function headerThemeFromAttribute(
  theme: string | null | undefined,
  pathname: string
): HeaderTheme {
  if (theme === "onLight" || theme === "onDark") {
    return theme;
  }

  return fallbackHeaderTheme(pathname);
}

export function isHeaderOnScreen(
  headerTop: number,
  headerBottom: number,
  viewportHeight: number
): boolean {
  return headerBottom > 0 && headerTop < viewportHeight;
}

export function headerThemeProbeY(
  headerTop: number,
  viewportHeight: number,
  probeOffset = HEADER_THEME_PROBE_Y
): number {
  return Math.min(Math.max(headerTop + probeOffset, 0), Math.max(viewportHeight - 1, 0));
}
