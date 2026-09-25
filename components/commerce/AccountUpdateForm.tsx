"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { accountPrimaryButtonClassName } from "@/components/commerce/accountStyles";
import { useAccountSavedNotice } from "@/components/commerce/useAccountSavedNotice";
import {
  ACCOUNT_SAVED_NOTICE,
  ACCOUNT_SAVED_NOTICE_MS,
  ACCOUNT_SAVE_FAILED_NOTICE,
} from "@/lib/commerce/account-page";
import { uiText } from "@/lib/typography";

/**
 * 外枠と枠内余白は置かない。入力欄自体の枠だけ残す。
 * 会員ページは横に広いので、入力欄が間延びしない幅で止める。
 */
const stackedFormClassName =
  "flex max-w-[560px] flex-col gap-[clamp(24px,calc(32px*var(--gap-scale-y)),32px)]";

/** 1 項目だけのフォームは、保存ボタンを入力欄の右へ並べる */
const inlineFormClassName =
  "flex flex-col flex-wrap gap-[clamp(16px,calc(20px*var(--gap-scale-y)),20px)] min-[640px]:flex-row min-[640px]:items-center min-[640px]:gap-x-[clamp(16px,calc(24px*var(--gap-scale-x)),24px)]";

type AccountUpdateFormProps = {
  action: string;
  /** 保存できたことを、このフォームの場所に出すための合図 */
  noticeKey: string;
  /** 1 行で収まるフォームは、保存ボタンを右に並べる */
  inlineSubmit?: boolean;
  /**
   * ページを読み直さずに保存する。
   *
   * 読み直すと、入力した内容を捨てて Shopify から読んだ値で描き直すため、
   * Shopify の応答が一瞬古いだけで「保存したのに戻った」ように見える。
   * 読み直さなければ、入力した内容がそのまま画面に残る。
   */
  keepValuesOnSave?: boolean;
  /**
   * 保存ボタンの横に並べる、保存以外の操作。
   *
   * 渡すと、まだ何も直していなくてもボタンの行を出す。
   * 追加用のフォームは、開いたまま閉じられないと行き止まりになる。
   */
  secondaryAction?: ReactNode;
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

/** 保存に失敗した理由。読める文でなければ、当たり障りのない 1 行にする */
async function saveErrorMessage(response: Response) {
  try {
    const result = (await response.json()) as { message?: unknown };
    return typeof result.message === "string" && result.message
      ? result.message
      : ACCOUNT_SAVE_FAILED_NOTICE;
  } catch {
    return ACCOUNT_SAVE_FAILED_NOTICE;
  }
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
  keepValuesOnSave = false,
  secondaryAction,
  children,
}: AccountUpdateFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const initialValuesRef = useRef("");
  const [isChanged, setIsChanged] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isJustSaved, setIsJustSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // JavaScript が動かないときは URL の合図で結果を受け取る
  const savedFromUrl = useAccountSavedNotice(noticeKey);

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

  useEffect(() => {
    if (!isJustSaved) {
      return;
    }

    const timer = window.setTimeout(
      () => setIsJustSaved(false),
      ACCOUNT_SAVED_NOTICE_MS
    );
    return () => window.clearTimeout(timer);
  }, [isJustSaved]);

  const saveInPlace = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      if (!keepValuesOnSave) {
        return;
      }

      event.preventDefault();
      const form = event.currentTarget;
      setIsSaving(true);
      setErrorMessage(null);

      try {
        const response = await fetch(action, {
          method: "post",
          body: new FormData(form),
          headers: { accept: "application/json" },
        });

        if (!response.ok) {
          setErrorMessage(await saveErrorMessage(response));
          return;
        }

        /*
          入力した内容はそのまま残す。
          いまの値を新しい「元の値」として覚え直し、保存ボタンを引っ込める。
        */
        initialValuesRef.current = serializeForm(form);
        setIsChanged(false);
        setIsJustSaved(true);
      } catch {
        setErrorMessage(ACCOUNT_SAVE_FAILED_NOTICE);
      } finally {
        setIsSaving(false);
      }
    },
    [action, keepValuesOnSave]
  );

  const showSaved = isJustSaved || savedFromUrl;

  return (
    <form
      ref={formRef}
      action={action}
      method="post"
      onInput={syncChanged}
      onChange={syncChanged}
      onKeyDown={blockImplicitSubmit}
      onSubmit={saveInPlace}
      className={inlineSubmit ? inlineFormClassName : stackedFormClassName}
    >
      <input type="hidden" name="notice" value={noticeKey} />

      {inlineSubmit ? (
        <div className="min-w-0 flex-1 min-[640px]:max-w-[560px]">{children}</div>
      ) : (
        children
      )}

      {/* 直したときだけ保存ボタンを出し、押したあとは同じ場所で結果を知らせる */}
      {isChanged || showSaved || secondaryAction ? (
        <div className="flex shrink-0 flex-wrap items-center gap-x-[clamp(16px,calc(24px*var(--gap-scale-x)),24px)] gap-y-3">
          {isChanged ? (
            <button
              type="submit"
              disabled={isSaving}
              className={`${accountPrimaryButtonClassName} disabled:cursor-not-allowed disabled:opacity-50`}
            >
              保存
            </button>
          ) : showSaved ? (
            <p
              role="status"
              className={`font-body-ja text-[var(--color-muted)] ${uiText(14)}`}
            >
              {ACCOUNT_SAVED_NOTICE}
            </p>
          ) : null}
          {secondaryAction}
        </div>
      ) : null}

      {/* 失敗したら入力内容を残したまま理由を出す。押し直せば再送できる */}
      {errorMessage ? (
        <p
          role="alert"
          className={`basis-full font-body-ja text-[#9b1b30] ${uiText(14)}`}
        >
          {errorMessage}
        </p>
      ) : null}
    </form>
  );
}
