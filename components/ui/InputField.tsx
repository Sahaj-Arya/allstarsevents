"use client";

import { InputHTMLAttributes, ReactNode } from "react";

type InputFieldProps = {
  label?: ReactNode;
  hint?: ReactNode;
  requiredMark?: boolean;
  error?: ReactNode;
  containerClassName?: string;
} & InputHTMLAttributes<HTMLInputElement>;

export function InputField({
  label,
  hint,
  requiredMark,
  error,
  containerClassName,
  className,
  ...props
}: InputFieldProps) {
  const base =
    "w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-500";

  return (
    <label
      className={["block space-y-1", containerClassName]
        .filter(Boolean)
        .join(" ")}
    >
      {label && (
        <span className="text-sm font-semibold text-neutral-800">
          {label}
          {requiredMark && <span className="text-red-500">*</span>}
        </span>
      )}
      <input
        className={[base, className].filter(Boolean).join(" ")}
        {...props}
      />
      {hint && <p className="text-xs text-neutral-500">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </label>
  );
}
