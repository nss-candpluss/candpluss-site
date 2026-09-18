"use client";

/** 印刷ダイアログから PDF として保存してもらう */
export function ReceiptPrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="cursor-pointer border border-[var(--foreground)] px-6 py-4 font-ui-en text-sm"
    >
      PRINT / PDF
    </button>
  );
}
