"use client";

import { useEffect, useState } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);

  useEffect(() => {
    const stored =
      typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
    if (stored) {
      try {
        setValue(JSON.parse(stored) as T);
      } catch {
        setValue(initialValue);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}
