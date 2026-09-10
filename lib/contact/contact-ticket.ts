import { generateTicketNumber } from "@/lib/contact/ticket-number";

/**
 * 受付番号を生成する（例: CTS-20260709-7K9M2P4R8T6W）。
 */
export function generateContactTicketNumber(now: Date = new Date()): string {
  return generateTicketNumber("CTS", now);
}
