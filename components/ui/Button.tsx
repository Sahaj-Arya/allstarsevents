"use client";

import { ButtonHTMLAttributes, PropsWithChildren } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "sm";

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: Variant;
    size?: Size;
    fullWidth?: boolean;
  }
>;

export function Button({
  children,
  className,
  variant = "primary",
  size = "md",
  fullWidth,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-full font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500";
  const variants: Record<Variant, string> = {
    primary:
      "bg-rose-600 text-white hover:bg-rose-500 disabled:bg-white/10 disabled:text-white/40",
    secondary:
      "border border-white/15 bg-white/5 text-white hover:bg-white/10 hover:border-white/25 disabled:opacity-60",
    ghost:
      "text-white/80 hover:bg-white/10 disabled:text-white/30 disabled:bg-transparent",
  };
  const sizes: Record<Size, string> = {
    md: "px-4 py-3 text-sm",
    sm: "px-3 py-2 text-sm",
  };

  return (
    <button
      className={[
        base,
        variants[variant],
        sizes[size],
        fullWidth ? "w-full" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}
