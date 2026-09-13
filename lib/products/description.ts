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

/** 構造化データ用。文字数制限がないため全文を渡す */
export function getProductDescriptionText(raw: string): string {
  const { title, body } = parseProductDescription(raw);
  return body || title || "";
}

/**
 * 検索結果は日本語で約120字、SNS プレビューはさらに短く切られる。
 * 文の途中で切れないよう、上限内の最後の句点までで収める。
 */
const META_DESCRIPTION_MAX_LENGTH = 120;

function truncateAtSentenceEnd(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }

  const head = text.slice(0, maxLength);
  const sentenceEnd = Math.max(
    head.lastIndexOf("。"),
    head.lastIndexOf("！"),
    head.lastIndexOf("？")
  );

  // 句点が前寄りすぎると情報量が落ちるので、その場合は文字数で切る
  if (sentenceEnd >= Math.floor(maxLength / 2)) {
    return head.slice(0, sentenceEnd + 1);
  }

  return `${head.trimEnd()}…`;
}

export function getProductMetaDescription(raw: string): string {
  return truncateAtSentenceEnd(
    getProductDescriptionText(raw),
    META_DESCRIPTION_MAX_LENGTH
  );
}
