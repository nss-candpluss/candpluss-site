type DailyTicketCounter = {
  dateKey: string;
  count: number;
};

let dailyTicketCounter: DailyTicketCounter = {
  dateKey: "",
  count: 0,
};

function getJstDateKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(date)
    .replace(/-/g, "");
}

/**
 * 受付番号を生成する（例: CTS-20260709-0001）。
 * 採番ロジックは将来 DB / CRM 等へ差し替え可能。
 */
export function generateContactTicketNumber(now: Date = new Date()): string {
  const dateKey = getJstDateKey(now);

  if (dailyTicketCounter.dateKey !== dateKey) {
    dailyTicketCounter = { dateKey, count: 0 };
  }

  dailyTicketCounter.count += 1;

  return `CTS-${dateKey}-${String(dailyTicketCounter.count).padStart(4, "0")}`;
}
