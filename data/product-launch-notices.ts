/**
 * 商品詳細の赤枠の左側に出す販売開始時期。
 *
 * 第一弾は公開ページの購入を止めるため、商品詳細では ADD TO CART の代わりに
 * この枠を出す。ここに無い商品は左側を空にして価格だけを出す。
 *
 * 一覧のステータス欄は `product-status-overrides.ts` が担う。文言が別なので
 * データも分けている（一覧は「〜発売」、この枠は「〜販売開始」）。
 */
const LAUNCH_2026_10_02 = "2026年10月2日(金)20:00 販売開始";
const LAUNCH_2027_SPRING = "2027年春 発売予定";

export const productLaunchNoticeByHandle: Record<string, string> = {
  // テント・シェルター / タープ / ペグ
  moya500: LAUNCH_2026_10_02,
  moya420: LAUNCH_2027_SPRING,
  nokuta: LAUNCH_2026_10_02,
  "zig-stake": LAUNCH_2026_10_02,

  // MOYA500 オプション
  moya500_roofsheet: LAUNCH_2026_10_02,
  moya500_groundsheet: LAUNCH_2026_10_02,
  moya500_innertent: LAUNCH_2026_10_02,
  "moya500_innertent-mesh": LAUNCH_2026_10_02,
  moya500_tpu: LAUNCH_2026_10_02,

  // MOYA420 オプション（本体と同時期）
  moya420_roofsheet: LAUNCH_2027_SPRING,
  moya420_groundsheet: LAUNCH_2027_SPRING,
  moya420_innertent: LAUNCH_2027_SPRING,
  "moya420_innertent-mesh": LAUNCH_2027_SPRING,

  // アクセサリー
  guyrope: LAUNCH_2026_10_02,
  "triangle-guylineadjuster": LAUNCH_2026_10_02,
  "gearaid-seam-grip": LAUNCH_2026_10_02,
  "gearaid-sil-nylon-patch": LAUNCH_2026_10_02,
};

/** 10/2 の販売開始日時。構造化データの `availabilityStarts` に出す */
const LAUNCH_2026_10_02_STARTS_AT = "2026-10-02T20:00:00+09:00";

/**
 * 販売開始日時。表示用の文言と取り違えないよう別の定数にするが、対象商品は
 * 上の表から引いて二重管理を避ける。
 *
 * 2027年春の商品は日時が決まっていないので入れない。日付の無い予定を
 * 構造化データに書くと、実際の販売開始とずれても直したことに気付けない。
 */
export const productLaunchStartsAtByHandle: Record<string, string> =
  Object.fromEntries(
    Object.entries(productLaunchNoticeByHandle)
      .filter(([, notice]) => notice === LAUNCH_2026_10_02)
      .map(([handle]) => [handle, LAUNCH_2026_10_02_STARTS_AT])
  );
