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

  return parts.map((part, index) => (
    <span key={`${part}-${index}`}>
      {index > 0 ? STATUS_LABEL_SEPARATOR : null}
      <span
        className={part === NEW_STATUS_TEXT ? "text-[var(--color-new)]" : undefined}
        style={
          part === NEW_STATUS_TEXT || !color ? undefined : { color }
        }
      >
        {part}
      </span>
    </span>
  ));
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
      } ${color && !hasNewLabel ? "" : "text-[var(--color-muted)]"} ${uiText(size)} ${className}`.trim()}
      style={color && !hasNewLabel ? { color } : undefined}
    >
      <StatusLabelContent label={displayLabel} color={color} />
    </p>
  );
}
