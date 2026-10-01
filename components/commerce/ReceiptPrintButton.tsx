"use client";

import { useState } from "react";

import { accountPrimaryButtonClassName } from "@/components/commerce/accountStyles";

type ReceiptPrintButtonProps = {
  /** 保存するファイル名（拡張子なし） */
  fileName: string;
};

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
/** 印刷の `@page` と同じ余白にして、PDF と印刷で同じ見た目にする */
const PAGE_MARGIN_MM = 12;
/** 300dpi で余白を除いた A4 幅。狭い画面で開いても粗くならないよう、これに合わせて撮る */
const CAPTURE_WIDTH_PX = 2200;

async function downloadReceiptPdf(fileName: string) {
  const sheet = document.querySelector<HTMLElement>("[data-receipt-sheet]");

  if (!sheet) {
    throw new Error("Receipt sheet not found.");
  }

  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas-pro"),
    import("jspdf"),
  ]);
  const canvas = await html2canvas(sheet, {
    backgroundColor: "#ffffff",
    scale: CAPTURE_WIDTH_PX / sheet.getBoundingClientRect().width,
  });

  const maxWidth = A4_WIDTH_MM - PAGE_MARGIN_MM * 2;
  const maxHeight = A4_HEIGHT_MM - PAGE_MARGIN_MM * 2;
  const ratio = canvas.height / canvas.width;
  const width = Math.min(maxWidth, maxHeight / ratio);
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  pdf.addImage(
    canvas.toDataURL("image/png"),
    "PNG",
    (A4_WIDTH_MM - width) / 2,
    PAGE_MARGIN_MM,
    width,
    width * ratio,
    undefined,
    "FAST"
  );
  pdf.save(`${fileName}.pdf`);
}

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
