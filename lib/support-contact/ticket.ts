import { generateTicketNumber } from "@/lib/contact/ticket-number";

/**
 * 製品保証・修理フォームの受付番号（例: SPR-20260909-7K9M2P4R8T6W）。
 * Contact の CTS 番号とは別採番。
 */
export function generateSupportContactTicketNumber(now: Date = new Date()): string {
  return generateTicketNumber("SPR", now);
}
