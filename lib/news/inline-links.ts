import type { NewsArticleInlineLink } from "./types";

export type NewsContentSegment =
  | { kind: "text"; text: string }
  | { kind: "link"; text: string; href: string };

/**
 * 本文を inlineLinks で分割する。
 * 対象語句は最初の一致だけをリンクにし、範囲が重なる指定は先に現れた方を採用する。
 */
export function splitContentByInlineLinks(
  content: string,
  inlineLinks: readonly NewsArticleInlineLink[] = []
): NewsContentSegment[] {
  const matches = inlineLinks
    .map((link) => ({ link, index: content.indexOf(link.text) }))
    .filter(({ link, index }) => link.text.length > 0 && index !== -1)
    .sort((a, b) => a.index - b.index);

  const segments: NewsContentSegment[] = [];
  let cursor = 0;

  for (const { link, index } of matches) {
    if (index < cursor) {
      continue;
    }

    if (index > cursor) {
      segments.push({ kind: "text", text: content.slice(cursor, index) });
    }

    segments.push({ kind: "link", text: link.text, href: link.href });
    cursor = index + link.text.length;
  }

  if (cursor < content.length) {
    segments.push({ kind: "text", text: content.slice(cursor) });
  }

  return segments;
}
