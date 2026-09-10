export type ContactTicketKind = "contact" | "support";

const TICKET_STORAGE_KEYS: Record<ContactTicketKind, string> = {
  contact: "candpluss:contact-ticket-number",
  support: "candpluss:support-contact-ticket-number",
};

const TICKET_PATTERNS: Record<ContactTicketKind, RegExp> = {
  contact: /^CTS-\d{8}-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{12}$/,
  support: /^SPR-\d{8}-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{12}$/,
};

export function writeContactTicketNumber(
  kind: ContactTicketKind,
  ticketNumber: string
): void {
  if (
    typeof window === "undefined" ||
    !TICKET_PATTERNS[kind].test(ticketNumber)
  ) {
    return;
  }

  window.sessionStorage.setItem(TICKET_STORAGE_KEYS[kind], ticketNumber);
}

export function readContactTicketNumber(
  kind: ContactTicketKind
): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const ticketNumber = window.sessionStorage.getItem(TICKET_STORAGE_KEYS[kind]);

  return ticketNumber && TICKET_PATTERNS[kind].test(ticketNumber)
    ? ticketNumber
    : null;
}
