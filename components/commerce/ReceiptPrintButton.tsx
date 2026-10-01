"use client";

import { useState } from "react";

import { accountPrimaryButtonClassName } from "@/components/commerce/accountStyles";
import { downloadReceiptPdf } from "@/lib/commerce/receipt-pdf";

type ReceiptPrintButtonProps = {
  /** 保存するファイル名（拡張子なし） */
  fileName: string;
};

/** 押したらそのまま PDF を保存する。作れなかったときだけ印刷ダイアログに逃がす */
export function ReceiptPrintButton({ fileName }: ReceiptPrintButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  return (
    <button
      type="button"
      disabled={isGenerating}
      onClick={async () => {
        setIsGenerating(true);

        try {
          await downloadReceiptPdf(fileName);
        } catch {
          window.print();
        } finally {
          setIsGenerating(false);
        }
      }}
      className={`${accountPrimaryButtonClassName} disabled:cursor-wait disabled:opacity-60`}
    >
      {isGenerating ? "PDFを作成しています" : "PDFダウンロード"}
    </button>
  );
}
