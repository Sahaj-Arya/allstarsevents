"use client";

import { ReactNode } from "react";

type Tone = "info" | "success" | "error";

type AlertProps = {
  tone?: Tone;
  children: ReactNode;
  className?: string;
};

const toneStyles: Record<Tone, string> = {
  info: "bg-neutral-50 text-neutral-700",
  success: "bg-green-50 text-green-700",
  error: "bg-red-50 text-red-700",
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
