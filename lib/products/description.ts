const LEADING_BRACED_TITLE = /^\s*\{([^{}]+)\}\s*/;

export type ParsedProductDescription = {
  title?: string;
  body: string;
};

function normalizeDescriptionBody(value: string): string {
  return value.replace(/\n{2,}/g, "\n").trim();
}

/** 説明文先頭の `{タイトル}` を見出しとして取り出す。無い場合は本文のみ */
export function parseProductDescription(raw: string): ParsedProductDescription {
  const match = raw.match(LEADING_BRACED_TITLE);
  const title = match?.[1]?.trim();

  if (!match || !title) {
    return { body: normalizeDescriptionBody(raw) };
  }

  return {
    title,
    body: normalizeDescriptionBody(raw.slice(match[0].length)),
  };
}

export function getProductMetaDescription(raw: string): string {
  const { title, body } = parseProductDescription(raw);
  return body || title || "";
}
