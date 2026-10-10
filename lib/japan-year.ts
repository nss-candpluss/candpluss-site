/** 日本時間の西暦。サーバーは UTC で動くので、年明けの 0〜9 時に前年にならないよう指定する */
export function japanYear(now: Date = new Date()): number {
  return Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
    }).format(now)
  );
}
