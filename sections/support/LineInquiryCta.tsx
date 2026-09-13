import { SiteImage } from "@/components/ui/SiteImage";
import { maskGraphicStyle } from "@/lib/maskStyle";
import { bodyText, uiText } from "@/lib/typography";
import { supportContactButtonClassName } from "@/sections/support/supportContactStyles";

const QR_SIZE_PX = 180;

const titleClassName = `font-body-ja font-bold text-[var(--foreground)] ${uiText(20)}`;
const bodyClassName = `mt-[calc(24px*var(--gap-scale))] font-body-ja text-[var(--foreground)] ${bodyText(15)}`;

type LineInquiryCtaProps = {
  label: string;
  body: string;
  href: string;
  icon: string;
  qrSrc: string;
  qrAlt: string;
  className?: string;
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
      <div className="hidden min-[1025px]:block">
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

      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`${supportContactButtonClassName} max-w-[400px] min-[1025px]:hidden`}
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
