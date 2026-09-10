export const CONTACT_DRAFT_TTL_MS = 24 * 60 * 60 * 1_000;

type DraftEnvelope = {
  data: unknown;
  expiresAt: number;
};

function isDraftEnvelope(value: unknown): value is DraftEnvelope {
  return (
    typeof value === "object" &&
    value !== null &&
    "data" in value &&
    "expiresAt" in value &&
    typeof value.expiresAt === "number"
  );
}

export function serializeExpiringDraft(
  data: unknown,
  now = Date.now()
): string {
  return JSON.stringify({
    data,
    expiresAt: now + CONTACT_DRAFT_TTL_MS,
  });
}

export function parseExpiringDraft<T>(
  raw: string,
  normalize: (value: unknown) => T | null,
  now = Date.now()
): T | null {
  try {
    const parsed: unknown = JSON.parse(raw);

    if (!isDraftEnvelope(parsed) || parsed.expiresAt <= now) {
      return null;
    }

    return normalize(parsed.data);
  } catch {
    return null;
  }
}
