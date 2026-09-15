"use client";

import Script from "next/script";

import { usePurchaseChannel } from "@/components/commerce/PurchaseChannelProvider";
import { googleAnalyticsMeasurementId } from "@/lib/analytics";

/**
 * GA4（gtag.js）を読み込む。
 *
 * 測定 ID が未設定の環境では何も出力しない。購入テスト領域
 * （/shopify-test）はテストの操作が計測データに混ざるため対象外にする。
 */
export function GoogleAnalytics() {
  const channel = usePurchaseChannel();

  if (!googleAnalyticsMeasurementId || channel !== "public") {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsMeasurementId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${googleAnalyticsMeasurementId}');`}
      </Script>
    </>
  );
}
