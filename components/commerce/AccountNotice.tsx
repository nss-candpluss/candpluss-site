"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { accountPageNotice } from "@/lib/commerce/account-page";

/** うまくいった知らせは読み終わる頃に消す。残り続けると今の操作の結果か分からなくなる */
const SUCCESS_NOTICE_MS = 4000;

/**
 * 更新後のリダイレクトに付くクエリを、1 行の結果表示に変える。
 *
 * 保存フォームの結果はフォームのその場に出すので、ここに来るのは
 * 一覧側の操作（既定の変更・削除）と、直し方を伝えたいエラーだけ。
 * タブを移ると URL からそのクエリが外れるので、表示も一緒に消える。
 */
export function AccountNotice() {
  const searchParams = useSearchParams();
  const notice = accountPageNotice(searchParams.toString());
  const isSuccess = notice?.tone === "success";
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (!isSuccess) {
      return;
    }

    const timer = window.setTimeout(
      () => setIsDismissed(true),
      SUCCESS_NOTICE_MS
    );
    return () => window.clearTimeout(timer);
  }, [isSuccess]);

  if (!notice || (isSuccess && isDismissed)) {
    return null;
  }

  return (
    <p
      role="status"
      className={`mt-[calc(24px*var(--gap-scale-y))] font-body-ja text-sm ${
        notice.tone === "error"
          ? "text-[#9b1b30]"
          : "text-[var(--foreground)]"
      }`}
    >
      {notice.message}
    </p>
  );
}
