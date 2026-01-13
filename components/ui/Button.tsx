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
    "inline-flex items-center justify-center rounded-full font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";
  const variants: Record<Variant, string> = {
    primary:
      "bg-black text-white hover:bg-neutral-800 disabled:bg-neutral-300 disabled:text-white",
    secondary:
      "border border-black/10 bg-white text-neutral-900 hover:border-black/30 disabled:opacity-60",
    ghost:
      "text-neutral-800 hover:bg-neutral-100 disabled:text-neutral-400 disabled:bg-transparent",
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
