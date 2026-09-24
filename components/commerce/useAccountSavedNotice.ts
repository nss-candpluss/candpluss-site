"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

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
 * 合図は URL のクエリで受け取るが、受け取ったらすぐ外す。
 * 残したままだと、表示中にリロードされたときにまた出てしまう。
 * 外したあとも出し続けられるよう、最初の描画の時点で受け取ったかを覚えておく。
 * 履歴は増やさないので、戻るボタンの行き先も変わらない。
 */
export function useAccountSavedNotice(noticeKey: string) {
  const searchParams = useSearchParams();
  const [wasSaved] = useState(
    () => accountSavedNoticeKey(searchParams.toString()) === noticeKey
  );
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    if (!wasSaved) {
      return;
    }

    const search = accountSearchWithoutNoticeKeys(
      window.location.search,
      ACCOUNT_SAVED_NOTICE_PARAMS
    );
    window.history.replaceState(null, "", search || window.location.pathname);

    const timer = window.setTimeout(() => setIsHidden(true), SAVED_NOTICE_MS);
    return () => window.clearTimeout(timer);
  }, [wasSaved]);

  return wasSaved && !isHidden;
}
