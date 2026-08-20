import type { ProductStatus } from "@/types/product";
import { uiText, type UiTextSizePx } from "@/lib/typography";

const statusLabels: Partial<Record<ProductStatus, string>> = {
  new: "NEW",
  comingSoon: "近日発売",
  waiting: "入荷待ち",
  preorder: "予約販売",
  ending: "在庫限り販売終了",
  ended: "販売終了",
  soldOut: "SOLD OUT",
  preorderMember: "先行予約：会員限定",
  backorderMember: "予約注文：会員限定",
  discontinuedSoon: "廃盤：在庫限り",
  discontinued: "販売終了",
};

type ProductStatusLabelProps = {
  status: ProductStatus;
  label?: string;
  color?: string;
  className?: string;
  size?: UiTextSizePx;
};

export function hasProductStatusLabel(
  status: ProductStatus,
  label?: string
): boolean {
  return Boolean(label ?? statusLabels[status]);
}

export function ProductStatusLabel({
  status,
  label,
  color,
  className = "",
  size = 11,
}: ProductStatusLabelProps) {
  const displayLabel = label ?? statusLabels[status];

  if (!displayLabel) {
    return null;
  }

  const isCustomLabel = Boolean(label);

  return (
    <p
      className={`${
        isCustomLabel ? "font-body-ja" : "font-ui-en"
      } ${color ? "" : "text-[var(--color-muted)]"} ${uiText(size)} ${className}`.trim()}
      style={color ? { color } : undefined}
    >
      {displayLabel}
    </p>
  );
}
