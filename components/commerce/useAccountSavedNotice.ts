"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { accountSavedNoticeKey } from "@/lib/commerce/account-page";

/** 読み終わる頃には消したい。残り続けると、今の操作の結果か分からなくなる */
const SAVED_NOTICE_MS = 4000;

/**
 * 自分のフォームの保存だったときだけ true を返し、数秒後に false へ戻す。
 *
 * 保存はサーバーへの POST とリダイレクトなので、毎回このページが読み直される。
 * URL が前回と同じでも、部品ごと作り直されるので数え直しは要らない。
 */
export function useAccountSavedNotice(noticeKey: string) {
  const searchParams = useSearchParams();
  const isSaved = accountSavedNoticeKey(searchParams.toString()) === noticeKey;
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!isSaved) {
      return;
    }

    const timer = window.setTimeout(
      () => setDismissedKey(noticeKey),
      SAVED_NOTICE_MS
    );
    return () => window.clearTimeout(timer);
  }, [isSaved, noticeKey]);

  return isSaved && dismissedKey !== noticeKey;
}
