"use client";

import { useSearchParams } from "next/navigation";

import { accountPageNotice } from "@/lib/commerce/account-page";

/**
 * 更新後のリダイレクトに付くクエリを、1 行の結果表示に変える。
 *
 * タブを移ると URL からそのクエリが外れるので、表示も一緒に消える。
 */
export function AccountNotice() {
  const searchParams = useSearchParams();
  const notice = accountPageNotice(searchParams.toString());

  if (!notice) {
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
