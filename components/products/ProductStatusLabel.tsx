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

const STATUS_LABEL_SEPARATOR = "　";
const NEW_STATUS_TEXT = "NEW";
const newBadgeClassName =
  "inline-flex items-center justify-center rounded-[4px] border border-[var(--color-new)] px-[calc(6px*var(--text-scale))] py-[calc(3px*var(--text-scale))] font-ui-en leading-none text-[var(--color-new)]";

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
      <span key={`${part}-${index}`} className={newBadgeClassName}>
        {part}
      </span>
    ) : (
      <span key={`${part}-${index}`} style={color ? { color } : undefined}>
        {part}
      </span>
    )
  );
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
      } ${color && !hasNewLabel ? "" : "text-[var(--color-muted)]"} ${uiText(size)} ${className}`.trim()}
      style={color && !hasNewLabel ? { color } : undefined}
    >
      <StatusLabelContent label={displayLabel} color={color} />
    </p>
  );
}
