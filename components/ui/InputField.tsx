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
    "w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500 disabled:cursor-not-allowed disabled:bg-white/5 disabled:text-white/40";

  return (
    <label
      className={["block space-y-1", containerClassName]
        .filter(Boolean)
        .join(" ")}
    >
      {label && (
        <span className="text-sm font-semibold text-white/90">
          {label}
          {requiredMark && <span className="text-red-500">*</span>}
        </span>
      )}
      <input
        className={[base, className].filter(Boolean).join(" ")}
        {...props}
      />
      {hint && <p className="text-xs text-white/50">{hint}</p>}
      {error && <p className="text-xs text-rose-300">{error}</p>}
    </label>
  );
}
