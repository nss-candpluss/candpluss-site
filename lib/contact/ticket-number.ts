import { randomBytes } from "node:crypto";

const TICKET_RANDOM_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const TICKET_RANDOM_LENGTH = 12;

export type ContactTicketPrefix = "CTS" | "SPR";

function getJstDateKey(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );

  return `${values.year}${values.month}${values.day}`;
}

export function createTicketRandomSuffix(
  bytes: Uint8Array = randomBytes(TICKET_RANDOM_LENGTH)
): string {
  if (bytes.length !== TICKET_RANDOM_LENGTH) {
    throw new Error(
      `Ticket random source must contain ${TICKET_RANDOM_LENGTH} bytes.`
    );
  }

  return Array.from(
    bytes,
    (byte) => TICKET_RANDOM_ALPHABET[byte & 31]
  ).join("");
}

export function generateTicketNumber(
  prefix: ContactTicketPrefix,
  now: Date = new Date()
): string {
  return `${prefix}-${getJstDateKey(now)}-${createTicketRandomSuffix()}`;
}
