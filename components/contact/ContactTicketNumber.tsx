"use client";

import { useSyncExternalStore } from "react";

import {
  readContactTicketNumber,
  type ContactTicketKind,
} from "@/lib/contact/ticket-storage";
import { uiText } from "@/lib/typography";

type ContactTicketNumberProps = {
  kind: ContactTicketKind;
};

function subscribe() {
  return () => {};
}

export function ContactTicketNumber({ kind }: ContactTicketNumberProps) {
  const ticketNumber = useSyncExternalStore(
    subscribe,
    () => readContactTicketNumber(kind),
    () => null
  );

  if (!ticketNumber) {
    return null;
  }

  return (
    <div className="mt-[calc(32px*var(--gap-scale-y))] text-left min-[431px]:text-center">
      <p className={`font-body-ja text-[var(--color-muted)] ${uiText(14)}`}>
        受付番号
      </p>
      <p
        className={`mt-[calc(8px*var(--gap-scale-y))] font-body-ja font-semibold text-[var(--foreground)] ${uiText(20)}`}
      >
        {ticketNumber}
      </p>
    </div>
  );
}
