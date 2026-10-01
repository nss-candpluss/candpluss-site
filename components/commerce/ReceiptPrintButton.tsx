"use client";

import { accountPrimaryButtonClassName } from "@/components/commerce/accountStyles";

type ReceiptPrintButtonProps = {
  /** 保存するときの既定のファイル名。ブラウザはページタイトルを使う */
  fileName: string;
};

/** 印刷ダイアログから PDF として保存してもらう */
export function ReceiptPrintButton({ fileName }: ReceiptPrintButtonProps) {
  return (
    <button
      type="button"
      onClick={() => {
        const pageTitle = document.title;

        document.title = fileName;
        window.addEventListener(
          "afterprint",
          () => {
            document.title = pageTitle;
          },
          { once: true }
        );
        window.print();
      }}
      className={accountPrimaryButtonClassName}
    >
      PDFダウンロード
    </button>
  );
}
