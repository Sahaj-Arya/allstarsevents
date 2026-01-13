"use client";

import { ReactNode } from "react";

type Option = {
  value: string;
  label: ReactNode;
};

type PillTabsProps = {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
};

export function PillTabs({ options, value, onChange }: PillTabsProps) {
  return (
    <div className="flex items-center gap-2">
      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={[
              "flex-1 rounded-full border px-3 py-2 text-sm font-semibold transition",
              isActive
                ? "border-black bg-black text-white"
                : "border-black/10 bg-white text-neutral-800 hover:border-black/30",
            ].join(" ")}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
