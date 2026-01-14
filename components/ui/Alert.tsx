"use client";

import { ReactNode } from "react";

type Tone = "info" | "success" | "error";

type AlertProps = {
  tone?: Tone;
  children: ReactNode;
  className?: string;
};

const toneStyles: Record<Tone, string> = {
  info: "border border-white/10 bg-white/5 text-white/80",
  success: "border border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
  error: "border border-rose-400/20 bg-rose-400/10 text-rose-200",
};

export function Alert({ tone = "info", children, className }: AlertProps) {
  return (
    <div
      className={["rounded-lg px-3 py-2 text-sm", toneStyles[tone], className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}
