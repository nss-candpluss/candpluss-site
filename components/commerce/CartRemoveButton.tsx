"use client";

import { maskGraphicStyle } from "@/lib/maskStyle";

const DELETE_ICON_SRC = "/assets/icons/icon_delete.svg";

type CartRemoveButtonProps = {
  disabled?: boolean;
  onClick: () => void;
};

export function CartRemoveButton({
  disabled = false,
  onClick,
}: CartRemoveButtonProps) {
  return (
    <button
      type="button"
      aria-label="削除"
      disabled={disabled}
      onClick={onClick}
      className="flex size-[32px] items-center justify-center disabled:opacity-30"
    >
      <span
        aria-hidden="true"
        className="block size-[24px] bg-current"
        style={maskGraphicStyle(DELETE_ICON_SRC)}
      />
    </button>
  );
}
