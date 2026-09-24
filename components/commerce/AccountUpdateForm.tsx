"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { accountPrimaryButtonClassName } from "@/components/commerce/accountButtonStyles";
import { useAccountSavedNotice } from "@/components/commerce/useAccountSavedNotice";
import { ACCOUNT_SAVED_NOTICE } from "@/lib/commerce/account-page";
import { uiText } from "@/lib/typography";

/**
 * 外枠と枠内余白は置かない。入力欄自体の枠だけ残す。
 * 会員ページは横に広いので、入力欄が間延びしない幅で止める。
 */
const stackedFormClassName =
  "flex max-w-[560px] flex-col gap-[calc(32px*var(--gap-scale-y))]";

/** 1 項目だけのフォームは、保存ボタンを入力欄の右へ並べる */
const inlineFormClassName =
  "flex flex-col gap-[calc(16px*var(--gap-scale-y))] min-[640px]:flex-row min-[640px]:items-center min-[640px]:gap-x-[calc(24px*var(--gap-scale-x))]";

type AccountUpdateFormProps = {
  action: string;
  /** 保存できたことを、このフォームの場所に出すための合図 */
  noticeKey: string;
  /** 1 行で収まるフォームは、保存ボタンを右に並べる */
  inlineSubmit?: boolean;
  children: ReactNode;
};

/**
 * 入力欄で Enter を押しただけでは送らない。
 *
 * 住所のように欄が多いフォームでは、途中で Enter を押すと
 * 書き終える前に保存されてしまう。保存はボタンを押したときだけにする。
 */
function blockImplicitSubmit(event: React.KeyboardEvent<HTMLFormElement>) {
  if (event.key !== "Enter" || event.shiftKey) {
    return;
  }

  const target = event.target;
  if (
    target instanceof HTMLTextAreaElement ||
    (target instanceof HTMLButtonElement && target.type === "submit")
  ) {
    return;
  }

  event.preventDefault();
}

/** 入力欄の並びを 1 本の文字列にして、初期値と比べられるようにする */
function serializeForm(form: HTMLFormElement) {
  return new URLSearchParams(
    [...new FormData(form).entries()].map(([key, value]) => [
      key,
      typeof value === "string" ? value : "",
    ])
  ).toString();
}

/**
 * 表示と編集を 1 つの画面にまとめるためのフォーム。
 *
 * 常に入力済みの状態で出しておき、実際に値が変わったときだけ保存ボタンを出す。
 * 元の値に戻したときは、またボタンを隠す。
 */
export function AccountUpdateForm({
  action,
  noticeKey,
  inlineSubmit = false,
  children,
}: AccountUpdateFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const initialValuesRef = useRef("");
  const [isChanged, setIsChanged] = useState(false);
  const showSaved = useAccountSavedNotice(noticeKey);

  const syncChanged = useCallback(() => {
    const form = formRef.current;
    if (!form) {
      return;
    }

    setIsChanged(serializeForm(form) !== initialValuesRef.current);
  }, []);

  useEffect(() => {
    const form = formRef.current;
    if (!form) {
      return;
    }

    initialValuesRef.current = serializeForm(form);
    setIsChanged(false);
  }, []);

  return (
    <form
      ref={formRef}
      action={action}
      method="post"
      onInput={syncChanged}
      onChange={syncChanged}
      onKeyDown={blockImplicitSubmit}
      className={inlineSubmit ? inlineFormClassName : stackedFormClassName}
    >
      <input type="hidden" name="notice" value={noticeKey} />

      {inlineSubmit ? (
        <div className="min-w-0 flex-1 min-[640px]:max-w-[560px]">{children}</div>
      ) : (
        children
      )}

      {/* 直したときだけ保存ボタンを出し、押したあとは同じ場所で結果を知らせる */}
      {isChanged || showSaved ? (
        <div className="shrink-0">
          {isChanged ? (
            <button type="submit" className={accountPrimaryButtonClassName}>
              保存
            </button>
          ) : (
            <p
              role="status"
              className={`font-body-ja text-[var(--color-muted)] ${uiText(14)}`}
            >
              {ACCOUNT_SAVED_NOTICE}
            </p>
          )}
        </div>
      ) : null}
    </form>
  );
}
