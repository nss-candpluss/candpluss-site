"use client";

import { useRef } from "react";

import {
  accountDialogActionsClassName,
  accountDialogClassName,
  accountPrimaryButtonClassName,
  accountSecondaryButtonClassName,
} from "@/components/commerce/accountStyles";
import { bodyText } from "@/lib/typography";

const LOGOUT_CONFIRM_MESSAGE = "ログアウトします。よろしいですか？";

/**
 * ログアウト。触れただけで締め出されると困るので、確認を挟む。
 *
 * 送信そのものは素のフォームのまま。押されたら一度止めて確認を出し、
 * 確認の中で押されたときだけ通す。こうしておくと、JavaScript が
 * 動かないときも確認は出ないだけで、ログアウトはできる。
 *
 * ダイアログは `showModal()` で開き、閉じるのは必ず `close()` を通す。
 * 最前面の層に載るので、隠すだけでは覆いが残ってページが押せなくなる。
 */
export function AccountLogoutButton() {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <form
      action="/account/logout"
      method="post"
      onSubmit={(event) => {
        const dialog = dialogRef.current;
        // 確認を開いたうえでの送信なら、そのまま通す
        if (!dialog || dialog.open) {
          return;
        }

        event.preventDefault();
        dialog.showModal();
      }}
    >
      {/* 出ていく操作なので、枠だけのボタンにして前に出さない */}
      <button type="submit" className={accountSecondaryButtonClassName}>
        ログアウト
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="account-logout-message"
        onClick={(event) => {
          // 覆っている部分を押したときだけ閉じる。中身を押しても閉じない
          if (event.target === dialogRef.current) {
            dialogRef.current?.close();
          }
        }}
        className={accountDialogClassName}
      >
        <p
          id="account-logout-message"
          className={`font-body-ja text-[var(--foreground)] ${bodyText(15)}`}
        >
          {LOGOUT_CONFIRM_MESSAGE}
        </p>
        <div className={accountDialogActionsClassName}>
          <button type="submit" className={accountPrimaryButtonClassName}>
            ログアウト
          </button>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className={accountSecondaryButtonClassName}
          >
            キャンセル
          </button>
        </div>
      </dialog>
    </form>
  );
}
