"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

import {
  ACCOUNT_SAVED_NOTICE_PARAMS,
  accountSavedNoticeKey,
  accountSearchWithoutNoticeKeys,
} from "@/lib/commerce/account-page";

/** 読み終わる頃には消したい。残り続けると、今の操作の結果か分からなくなる */
const SAVED_NOTICE_MS = 4000;

/**
 * 自分のフォームの保存だったときだけ true を返し、数秒後に false へ戻す。
 *
 * 消すときは URL から合図も外す。残したままだとリロードでまた出てしまう。
 * 履歴は増やさないので、戻るボタンの行き先も変わらない。
 */
export function useAccountSavedNotice(noticeKey: string) {
  const searchParams = useSearchParams();
  const isSaved = accountSavedNoticeKey(searchParams.toString()) === noticeKey;

  useEffect(() => {
    if (!isSaved) {
      return;
    }

    const timer = window.setTimeout(() => {
      const search = accountSearchWithoutNoticeKeys(
        window.location.search,
        ACCOUNT_SAVED_NOTICE_PARAMS
      );
      window.history.replaceState(
        null,
        "",
        search || window.location.pathname
      );
    }, SAVED_NOTICE_MS);

    return () => window.clearTimeout(timer);
  }, [isSaved]);

  return isSaved;
}
