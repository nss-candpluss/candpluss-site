import type { TextareaHTMLAttributes } from "react";

import type { ContactFieldStatus } from "@/lib/contact/field-status";

type ContactStaticLabelTextareaProps =
  TextareaHTMLAttributes<HTMLTextAreaElement> & {
    label: string;
    status?: ContactFieldStatus;
  };

const borderClassNameByStatus: Record<ContactFieldStatus, string> = {
  idle:
    "border-[var(--color-divider)] focus:border-[var(--foreground)]",
  valid:
    "border-[var(--foreground)] focus:border-[var(--foreground)]",
  invalid: "border-red-600 focus:border-red-600",
};

const fieldClassName =
  "peer block w-full rounded-[8px] border bg-white px-[clamp(12px,calc(20px*var(--gap-scale-x)),20px)] pt-[clamp(12px,calc(20px*var(--gap-scale-y)),20px)] pb-[clamp(10px,calc(16px*var(--gap-scale-y)),16px)] font-body-ja text-[16px] leading-[1.3] font-semibold text-[var(--foreground)] outline-none transition-colors duration-200 placeholder:text-transparent";

const labelClassName =
  "pointer-events-none absolute left-[clamp(8px,calc(16px*var(--gap-scale-x)),16px)] top-[clamp(12px,calc(20px*var(--gap-scale-y)),20px)] bg-white px-[4px] font-body-ja text-[16px] leading-[16px] font-normal text-[var(--foreground)] transition-opacity duration-200 ease-out peer-[:not(:placeholder-shown)]:opacity-0";

export function ContactStaticLabelTextarea({
  id,
  label,
  status = "idle",
  className = "",
  ...props
}: ContactStaticLabelTextareaProps) {
  return (
    <div className="relative">
      <textarea
        {...props}
        id={id}
        placeholder=" "
        className={`${fieldClassName} ${borderClassNameByStatus[status]} ${className}`}
      />
      <label htmlFor={id} className={labelClassName}>
        {label}
      </label>
    </div>
  );
}
