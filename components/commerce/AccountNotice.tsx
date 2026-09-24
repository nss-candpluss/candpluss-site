"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import {
  ACCOUNT_UPDATED_NOTICE_PARAMS,
  accountPageNotice,
  accountSearchWithoutNoticeKeys,
} from "@/lib/commerce/account-page";

/** うまくいった知らせは読み終わる頃に消す。残り続けると今の操作の結果か分からなくなる */
const SUCCESS_NOTICE_MS = 4000;

/**
 * 更新後のリダイレクトに付くクエリを、1 行の結果表示に変える。
 *
 * 保存フォームの結果はフォームのその場に出すので、ここに来るのは
 * 一覧側の操作（既定の変更・削除）と、直し方を伝えたいエラーだけ。
 *
 * うまくいった知らせは、受け取った時点で URL から外してから数秒だけ出す。
 * 残したままだと、表示中にリロードされたときにまた出てしまう。
 * エラーは直すまで読めるように残す。
 */
export function AccountNotice() {
  const searchParams = useSearchParams();
  const notice = accountPageNotice(searchParams.toString());
  const [savedNotice] = useState(() => {
    const first = accountPageNotice(searchParams.toString());
    return first?.tone === "success" ? first : null;
  });
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    if (!savedNotice) {
      return;
    }

    const search = accountSearchWithoutNoticeKeys(
      window.location.search,
      ACCOUNT_UPDATED_NOTICE_PARAMS
    );
    window.history.replaceState(null, "", search || window.location.pathname);

    const timer = window.setTimeout(() => setIsHidden(true), SUCCESS_NOTICE_MS);
    return () => window.clearTimeout(timer);
  }, [savedNotice]);

  // URL から外したあとも出し続けるので、覚えておいた方を先に見る
  const shown = savedNotice && !isHidden ? savedNotice : notice;

  if (!shown) {
    return null;
  }

  return (
    <p
      role="status"
      className={`mt-[calc(24px*var(--gap-scale-y))] font-body-ja text-sm ${
        shown.tone === "error"
          ? "text-[#9b1b30]"
          : "text-[var(--foreground)]"
      }`}
    >
      {shown.message}
    </p>
  );
}
