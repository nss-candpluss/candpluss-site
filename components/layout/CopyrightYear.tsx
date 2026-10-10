"use client";

import { useSyncExternalStore } from "react";

import { japanYear } from "@/lib/japan-year";

function subscribe() {
  return () => {};
}

/**
 * 静的ページは HTML がビルドした時点の年で固まる。作り直さなくても
 * 年明けに切り替わるよう、ブラウザで日本時間の年を求め直す。
 */
export function CopyrightYear({ fallbackYear }: { fallbackYear: number }) {
  const year = useSyncExternalStore(
    subscribe,
    () => japanYear(),
    () => fallbackYear
  );

  return <>{year}</>;
}
