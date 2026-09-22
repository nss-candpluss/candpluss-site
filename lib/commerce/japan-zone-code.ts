import { japanesePrefectures } from "@/data/contact";

/**
 * Shopify の `zoneCode` は ISO 3166-2:JP（= JIS の都道府県コード）。
 * `japanesePrefectures` が JIS 順に並んでいるので、並び順から組み立てる。
 */
export const japanZones = japanesePrefectures.map((prefecture, index) => ({
  prefecture,
  zoneCode: `JP-${String(index + 1).padStart(2, "0")}`,
}));

/** `jp-1` や `13` のような表記も Shopify と同じ `JP-01` 形式に寄せる */
export function normalizeJapanZoneCode(value?: string | null) {
  const digits = value?.trim().replace(/^JP-?/i, "") ?? "";
  const zoneCode = `JP-${digits.padStart(2, "0")}`;

  return japanZones.some((zone) => zone.zoneCode === zoneCode) ? zoneCode : "";
}

export function prefectureFromJapanZoneCode(value?: string | null) {
  const zoneCode = normalizeJapanZoneCode(value);

  return japanZones.find((zone) => zone.zoneCode === zoneCode)?.prefecture ?? "";
}
