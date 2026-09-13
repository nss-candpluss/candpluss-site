import { SiteImage } from "@/components/ui/SiteImage";
import { maskGraphicStyle } from "@/lib/maskStyle";
import { bodyText, uiText } from "@/lib/typography";
import { supportContactButtonClassName } from "@/sections/support/supportContactStyles";

const QR_SIZE_PX = 180;

/**
 * LINE の QR は 1376px 以下でボタン表示に切り替える。
 * サイト共通の PC / SP 境界（1025px）とは別管理。
 */
export const lineQrPanelVisibilityClassName = "hidden min-[1377px]:block";
export const lineQrButtonVisibilityClassName = "min-[1377px]:hidden";

const titleClassName = `font-body-ja font-bold text-[var(--foreground)] ${uiText(20)}`;
const bodyClassName = `mt-[calc(24px*var(--gap-scale))] font-body-ja text-[var(--foreground)] ${bodyText(15)}`;

type LineQrPanelProps = {
  label: string;
  body: string;
  qrSrc: string;
  qrAlt: string;
  className?: string;
};

/** 見出し・案内文・QR。PC でボタンの代わりに見せる。 */
export function LineQrPanel({
  label,
  body,
  qrSrc,
  qrAlt,
  className = "",
}: LineQrPanelProps) {
  return (
    <div className={className}>
      <h3 className={titleClassName}>{label}</h3>
      <p className={bodyClassName}>{body}</p>
      <SiteImage
        src={qrSrc}
        alt={qrAlt}
        width={QR_SIZE_PX}
        height={QR_SIZE_PX}
        sizes={`${QR_SIZE_PX}px`}
        className="mt-[calc(24px*var(--gap-scale-y))] size-[180px]"
      />
    </div>
  );
}

type LineInquiryCtaProps = LineQrPanelProps & {
  href: string;
  icon: string;
};

export function LineInquiryCta({
  label,
  body,
  href,
  icon,
  qrSrc,
  qrAlt,
  className = "",
}: LineInquiryCtaProps) {
  return (
    <div className={className}>
      <LineQrPanel
        label={label}
        body={body}
        qrSrc={qrSrc}
        qrAlt={qrAlt}
        className={lineQrPanelVisibilityClassName}
      />

      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`${supportContactButtonClassName} max-w-[400px] ${lineQrButtonVisibilityClassName}`}
      >
        <span
          aria-hidden="true"
          className="size-[calc(24px*var(--text-scale))] shrink-0 bg-current"
          style={maskGraphicStyle(icon)}
        />
        {label}
      </a>
    </div>
  );
}
