"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { arrowMaskStyle } from "@/lib/maskStyle";
import { supportContactButtonClassName } from "@/sections/support/supportContactStyles";

/** 外枠と枠内余白は置かない。入力欄自体の枠だけ残す */
const accountUpdateFormClassName =
  "flex flex-col gap-[calc(32px*var(--gap-scale-y))] [&>div]:border-b-0 [&>div]:px-0 [&>div]:py-0 [&>div:first-child]:pt-0 [&>div:last-child]:pb-0 [&>div>div:first-child>span]:hidden";

type AccountUpdateFormProps = {
  action: string;
  submitLabel: string;
  children: ReactNode;
};

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
 * 常に入力済みの状態で出しておき、実際に値が変わったときだけ更新ボタンを
 * 押せるようにする。元の値に戻したときは、また押せない状態へ戻す。
 */
export function AccountUpdateForm({
  action,
  submitLabel,
  children,
}: AccountUpdateFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const initialValuesRef = useRef("");
  const [isChanged, setIsChanged] = useState(false);

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
      className={accountUpdateFormClassName}
    >
      {children}

      <div>
        <button
          type="submit"
          disabled={!isChanged}
          className={`${supportContactButtonClassName} cursor-pointer disabled:cursor-not-allowed disabled:opacity-50`}
        >
          <span
            aria-hidden="true"
            className="size-[calc(24px*var(--text-scale))] shrink-0 bg-current"
            style={arrowMaskStyle}
          />
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
