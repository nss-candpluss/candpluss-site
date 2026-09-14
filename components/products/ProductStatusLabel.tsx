"use client";

import { usePurchaseChannel } from "@/components/commerce/PurchaseChannelProvider";
import { productStatusDisplayOverrides } from "@/data/product-status-overrides";
import { showsStatusDisplayOverride } from "@/lib/commerce/purchase-channel";
import type { ProductStatus } from "@/types/product";
import { uiText, type UiTextSizePx } from "@/lib/typography";

const statusLabels: Partial<Record<ProductStatus, string>> = {
  comingSoon: "近日発売",
  waiting: "入荷待ち",
  preorder: "予約販売",
  ending: "在庫限り販売終了",
  ended: "販売終了",
  soldOut: "SOLD OUT",
};

const STATUS_LABEL_SEPARATOR = "　";
const NEW_STATUS_TEXT = "NEW";
export const listingStatusRowMinHeightClassName =
  "min-h-[calc(1.5*clamp(11px,calc(12px*var(--text-scale)),12px))]";
const newBadgeClassName =
  "inline-flex h-[1.5em] shrink-0 items-center justify-center box-border rounded-[4px] border border-[var(--color-new)] px-[0.45em] font-ui-en !text-[clamp(11px,calc(12px*var(--text-scale)),12px)] text-[var(--color-new)] !leading-none";

type ProductStatusLabelProps = {
  handle?: string;
  status: ProductStatus;
  label?: string;
  color?: string;
  className?: string;
  size?: UiTextSizePx;
};

export function getProductStatusDisplayOverride(handle?: string) {
  if (!handle) {
    return undefined;
  }

  return productStatusDisplayOverrides[handle];
}

/**
 * 差し替えを引くための handle。テスト領域では差し替えを出さないので
 * `undefined` を返し、Shopify 本来のステータス表示に戻す。
 */
export function useStatusDisplayOverrideHandle(
  handle?: string
): string | undefined {
  const channel = usePurchaseChannel();

  return showsStatusDisplayOverride(channel) ? handle : undefined;
}

export function hasProductStatusLabel(
  status: ProductStatus,
  label?: string,
  handle?: string
): boolean {
  if (getProductStatusDisplayOverride(handle)) {
    return true;
  }

  return Boolean(label ?? statusLabels[status]);
}

function StatusLabelContent({
  label,
  color,
}: {
  label: string;
  color?: string;
}) {
  const parts = label.split(STATUS_LABEL_SEPARATOR);

  if (!parts.includes(NEW_STATUS_TEXT)) {
    return label;
  }

  return parts.map((part, index) =>
    part === NEW_STATUS_TEXT ? (
      <span
        key={`${part}-${index}`}
        className={newBadgeClassName}
        style={{ lineHeight: 1 }}
      >
        <span className="block !leading-none" style={{ lineHeight: 1 }}>
          {part}
        </span>
      </span>
    ) : (
      <span key={`${part}-${index}`} style={color ? { color } : undefined}>
        {part}
      </span>
    )
  );
}

export function ProductStatusLabel({
  handle,
  status,
  label,
  color,
  className = "",
  size = 11,
}: ProductStatusLabelProps) {
  const overrideHandle = useStatusDisplayOverrideHandle(handle);
  const override = getProductStatusDisplayOverride(overrideHandle);
  const displayLabel = override?.label ?? label ?? statusLabels[status];
  const displayColor = override?.color ?? color;

  if (!displayLabel) {
    return null;
  }

  const isCustomLabel = Boolean(override || label);
  const hasNewLabel = displayLabel
    .split(STATUS_LABEL_SEPARATOR)
    .includes(NEW_STATUS_TEXT);

  return (
    <p
      className={`${
        isCustomLabel ? "font-body-ja" : "font-ui-en"
      } ${
        hasNewLabel
          ? "inline-flex items-center flex-wrap gap-x-[calc(8px*var(--gap-scale-x))] gap-y-[calc(4px*var(--gap-scale-y))]"
          : ""
      } ${displayColor && !hasNewLabel ? "" : "text-[var(--color-muted)]"} ${uiText(size)} ${className}`.trim()}
      style={displayColor && !hasNewLabel ? { color: displayColor } : undefined}
    >
      <StatusLabelContent label={displayLabel} color={displayColor} />
    </p>
  );
}
