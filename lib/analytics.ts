/**
 * Google Analytics 4 の測定 ID。
 *
 * 未設定の環境では計測しない。ローカル開発や Vercel のプレビューを
 * 本番の計測データに混ぜないため、Vercel では Production だけに設定する。
 * NEXT_PUBLIC_ はクライアントに埋め込まれるが、測定 ID は公開前提の値。
 */
export const googleAnalyticsMeasurementId =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "";
