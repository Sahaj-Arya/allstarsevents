"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Lottie from "react-lottie-player";

export function GlobalLoader() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [animationData, setAnimationData] = useState<any | null>(null);

  useEffect(() => {
    let mounted = true;
    // fetch lottie JSON from public assets
    void fetch("/assets/bottle.json")
      .then((r) => r.json())
      .then((data) => {
        if (mounted) setAnimationData(data);
      })
      .catch(() => {
        /* ignore */
      });

    const t = setTimeout(() => setLoading(false), 2000);
    return () => {
      mounted = false;
      clearTimeout(t);
    };
  }, []);

  useEffect(() => {
    // show loader for route changes
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(t);
  }, [pathname]);

  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-99 flex items-center justify-center bg-black/90 w-full h-full">
      <div className="flex flex-col items-center gap-4">
        {animationData ? (
          <div>
            <Lottie
              animationData={animationData}
              play
              loop
              speed={1}
              style={{ width: 220, height: 220, background: "transparent" }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
