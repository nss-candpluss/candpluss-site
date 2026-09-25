"use client";

import { useState, type ReactNode } from "react";

import { accountPrimaryButtonClassName } from "@/components/commerce/accountStyles";
import { contactCheckboxBoxClassName } from "@/sections/contact/contactStyles";
import { bodyText, uiText } from "@/lib/typography";

export type AccountConsentDocument = {
  id: string;
  /** 枠の見出し。文書そのものの題は枠の中にある */
  label: string;
  body: ReactNode;
};

const documentLabelClassName = `font-body-ja font-bold text-[var(--foreground)] ${uiText(16)}`;
const noteClassName = `font-body-ja text-[var(--color-muted)] ${bodyText(14)}`;

/*
  端数の切り上げで数 px 届かないことがあるので、少し手前で読み終わりとみなす。
  ここを 0 にすると、いちばん下まで送っても同意できない画面が出る。
*/
const SCROLL_END_TOLERANCE = 8;

/**
 * 文書を 1 つ収めた枠。いちばん下まで送られたら読み終わりを知らせる。
 *
 * 枠自体に `tabIndex` を付けて、キーボードでも送れるようにする。
 * 付けないと、読み終われない＝同意できない人が出る。
 */
function ConsentDocumentBox({
  entry,
  isRead,
  onRead,
}: {
  entry: AccountConsentDocument;
  isRead: boolean;
  onRead: () => void;
}) {
  function checkRead(node: HTMLDivElement) {
    /*
      枠より中身が短ければ送る余地がない。
      画面が広いときに読み終われなくなるので、その場で読み終わりにする。
    */
    if (
      node.scrollTop + node.clientHeight >=
      node.scrollHeight - SCROLL_END_TOLERANCE
    ) {
      onRead();
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        {/* 送っている間も何を読んでいるか分かるよう、題は枠の外に出す */}
        <h3 className={documentLabelClassName}>{entry.label}</h3>
        <p role="status" className={noteClassName}>
          {isRead ? "最後までお読みいただきました" : "最後までスクロールしてください"}
        </p>
      </div>

      <div
        ref={(node) => {
          if (node) {
            checkRead(node);
          }
        }}
        onScroll={(event) => checkRead(event.currentTarget)}
        tabIndex={0}
        role="group"
        aria-label={entry.label}
        /*
          Lenis に wheel を渡さない。
          慣性スクロールはページ全体の wheel を受け取って打ち消すので、
          付けないと枠の中が動かず、読み終われない＝同意できない。
          効くのは PC 幅だけなので、スマホでは症状が出ない。
        */
        data-lenis-prevent
        className="mt-[clamp(12px,calc(16px*var(--gap-scale-y)),16px)] h-[clamp(240px,45vh,400px)] overflow-y-auto overscroll-contain rounded-[8px] border border-[var(--color-divider)] bg-white p-[clamp(16px,calc(28px*var(--gap-scale-x)),28px)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--foreground)]"
      >
        {entry.body}
      </div>
    </div>
  );
}

/**
 * 会員登録の前に規約を読んでもらう。
 *
 * すべての枠を最後まで送るまでチェックを押せず、
 * チェックが入るまで次へ進めない。読まずに通り抜ける道を作らない。
 *
 * JavaScript が動かないときは読み終わりを見張れない。
 * 締め出すわけにはいかないので、`<noscript>` に進む道を残す。
 */
export function AccountConsentGate({
  documents,
  returnTo,
}: {
  documents: readonly AccountConsentDocument[];
  /** 既定の行き先でよければ省く */
  returnTo?: string;
}) {
  const [readIds, setReadIds] = useState<readonly string[]>([]);
  const [hasAgreed, setHasAgreed] = useState(false);
  const canAgree = documents.every((entry) => readIds.includes(entry.id));

  return (
    <form
      action="/account/login/start"
      method="post"
      className="flex flex-col gap-[clamp(24px,calc(32px*var(--gap-scale-y)),32px)]"
    >
      {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}

      {documents.map((entry) => (
        <ConsentDocumentBox
          key={entry.id}
          entry={entry}
          isRead={readIds.includes(entry.id)}
          onRead={() =>
            setReadIds((current) =>
              current.includes(entry.id) ? current : [...current, entry.id]
            )
          }
        />
      ))}

      <div>
        {/* 読み終わるまでは押せない。押せない理由は下に出す */}
        <label
          className={`flex w-fit items-center gap-x-[clamp(8px,calc(12px*var(--gap-scale-x)),12px)] ${
            canAgree ? "cursor-pointer" : "cursor-not-allowed opacity-50"
          }`}
        >
          <input
            type="checkbox"
            name="consent"
            required
            disabled={!canAgree}
            checked={hasAgreed}
            onChange={(event) => setHasAgreed(event.target.checked)}
            className="peer sr-only"
          />
          <span aria-hidden="true" className={contactCheckboxBoxClassName} />
          <span
            className={`font-body-ja text-[16px] leading-[1.3] text-[var(--foreground)]`}
          >
            利用規約とプライバシーポリシーに同意します
          </span>
        </label>

        {canAgree ? null : (
          <p className={`mt-[12px] ${noteClassName}`}>
            上の2つの枠を最後までお読みいただくと、チェックできるようになります。
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={!hasAgreed}
        className={`${accountPrimaryButtonClassName} w-full disabled:cursor-not-allowed disabled:opacity-50`}
      >
        同意して会員登録に進む
      </button>

      <noscript>
        <p className={noteClassName}>
          お使いの環境では読み終わりを確認できません。上の内容をお読みいただいたうえで、
          下のボタンからお進みください。進んだ時点で、利用規約とプライバシーポリシーに
          同意されたものとします。
        </p>
        <button
          type="submit"
          className={`${accountPrimaryButtonClassName} mt-[16px] w-full`}
        >
          同意して会員登録に進む
        </button>
      </noscript>
    </form>
  );
}
