"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import Lottie from "react-lottie-player";
import ALL_STARS_LOGO from "../public/assets/allstars_studio.png";
import DEFAULT_BOTTLE_ANIMATION from "../public/assets/bottle.json";
import {
  fetchHomeSettings,
  HOME_SETTINGS_SYNC_KEY,
  readCachedHomeSettings,
} from "../lib/api";
import { HomeSettings } from "../lib/types";

const DEFAULT_LOADER_TEXT = "AllStars Studios";

export function GlobalLoader() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [animationData, setAnimationData] = useState<Record<string, unknown> | null>(
    DEFAULT_BOTTLE_ANIMATION as Record<string, unknown>,
  );
  const [loaderText, setLoaderText] = useState(DEFAULT_LOADER_TEXT);
  const [showLoaderLottie, setShowLoaderLottie] = useState(true);
  const [showLoaderLogo, setShowLoaderLogo] = useState(true);
  const [showLoaderText, setShowLoaderText] = useState(true);
  const hasMountedRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    const applySettings = async (settings: HomeSettings | null) => {
      if (!mounted) return;

      setLoaderText(settings?.loaderText?.trim() || DEFAULT_LOADER_TEXT);
      setShowLoaderLottie(settings?.showLoaderLottie ?? true);
      setShowLoaderLogo(settings?.showLoaderLogo ?? true);
      setShowLoaderText(settings?.showLoaderText ?? true);

      if (!(settings?.showLoaderLottie ?? true)) {
        setAnimationData(null);
        return;
      }

      if (settings?.loaderAnimationData) {
        setAnimationData(settings.loaderAnimationData);
        return;
      }

      setAnimationData(DEFAULT_BOTTLE_ANIMATION as Record<string, unknown>);
    };

    const cachedSettings = readCachedHomeSettings();
    void applySettings(cachedSettings);
    void fetchHomeSettings().then((settings) => {
      void applySettings(settings);
    });

    const handleHomeSettingsUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<HomeSettings>;
      void applySettings(customEvent.detail || null);
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== HOME_SETTINGS_SYNC_KEY || !event.newValue) return;

      try {
        const settings = JSON.parse(event.newValue) as HomeSettings;
        void applySettings(settings);
      } catch {
        // Ignore invalid storage updates.
      }
    };

    window.addEventListener(
      "allstars:home-settings-updated",
      handleHomeSettingsUpdated as EventListener,
    );
    window.addEventListener("storage", handleStorage);

    const t = setTimeout(() => setLoading(false), 2000);
    return () => {
      mounted = false;
      window.removeEventListener(
        "allstars:home-settings-updated",
        handleHomeSettingsUpdated as EventListener,
      );
      window.removeEventListener("storage", handleStorage);
      clearTimeout(t);
    };
  }, []);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    const showTimer = window.setTimeout(() => setLoading(true), 0);
    const hideTimer = window.setTimeout(() => setLoading(false), 2000);
    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
    };
  }, [pathname]);

  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-99 h-full w-full bg-black/90">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_45%)]" />
      <div className="relative flex h-full flex-col items-center justify-center px-6">
        {showLoaderLottie && animationData ? (
          <div className="flex items-center justify-center">
            <Lottie
              animationData={animationData}
              play
              loop
              speed={1}
              style={{ width: 220, height: 220, background: "transparent" }}
            />
          </div>
        ) : null}
        {(showLoaderLogo || showLoaderText) && (
          <div className="mt-5 flex flex-col items-center gap-3 text-center text-white/90">
            {showLoaderLogo ? (
              <Image alt="AllStars" src={ALL_STARS_LOGO} width={42} height={42} />
            ) : null}
            {showLoaderText ? (
              <p className="text-xs font-semibold uppercase tracking-[0.28em] sm:text-sm">
                {loaderText || DEFAULT_LOADER_TEXT} ...
              </p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
