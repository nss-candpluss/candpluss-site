import type {
  InputHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

import type { ContactFieldStatus } from "@/lib/contact/field-status";

type SupportFloatingInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  status?: ContactFieldStatus;
};

type SupportTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
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
  "pointer-events-none absolute left-[clamp(8px,calc(16px*var(--gap-scale-x)),16px)] top-1/2 -translate-y-1/2 bg-white px-[4px] font-body-ja text-[16px] leading-[16px] font-normal text-[var(--foreground)] transition-all duration-200 ease-out peer-focus:top-0 peer-focus:text-[clamp(11px,calc(12px*var(--text-scale)),12px)] peer-focus:leading-[calc(12px*var(--text-scale))] peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:text-[clamp(11px,calc(12px*var(--text-scale)),12px)] peer-[:not(:placeholder-shown)]:leading-[calc(12px*var(--text-scale))]";

const plainTextareaClassName =
  "block w-full rounded-[8px] border bg-white px-[clamp(12px,calc(20px*var(--gap-scale-x)),20px)] py-[clamp(12px,calc(16px*var(--gap-scale-y)),16px)] font-body-ja text-[16px] leading-[1.3] font-semibold text-[var(--foreground)] outline-none transition-colors duration-200";

export function SupportFloatingInput({
  id,
  label,
  status = "idle",
  className = "",
  ...props
}: SupportFloatingInputProps) {
  return (
    <div className="relative">
      <input
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

export function SupportTextarea({
  id,
  status = "idle",
  className = "",
  ...props
}: SupportTextareaProps) {
  return (
    <textarea
      {...props}
      id={id}
      className={`${plainTextareaClassName} ${borderClassNameByStatus[status]} ${className}`}
    />
  );
}
