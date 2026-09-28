"use client";

import { useState, useEffect, useCallback } from "react";

export const DEFAULT_PLATFORMS: string[] = [
  "طلای آنلاین دیجی‌کالا",
  "طلای آنلاین بلوبانک",
  "میلی گلد (Milli Gold)",
  "طلاین (TalaIn)",
  "زربد (ZarBod)",
  "کارگزاری مفید",
  "کارگزاری آگاه",
  "صرافی نوبیتکس",
  "صرافی والکس",
  "بانک ملت",
  "بانک ملی",
  "بانک رسالت",
  "بانک سامان",
  "اسنپ‌پی (خرید اقساطی)",
  "دیجی‌پی (خرید اقساطی)",
  "صندوق قرض‌الحسنه خانوادگی",
  "گاوصندوق شخصی",
];

const STORAGE_KEY = "pfc_user_platforms";
const PLATFORMS_CHANGED_EVENT = "pfc_platforms_changed";

function getStoredPlatforms(): string[] {
  if (typeof window === "undefined") return DEFAULT_PLATFORMS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PLATFORMS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (e) {
    console.error("Failed to parse user platforms from storage:", e);
  }
  return DEFAULT_PLATFORMS;
}

function savePlatforms(platforms: string[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(platforms));
    window.dispatchEvent(new CustomEvent(PLATFORMS_CHANGED_EVENT, { detail: platforms }));
  } catch (e) {
    console.error("Failed to save user platforms to storage:", e);
  }
}

export function useUserPlatforms() {
  const [platforms, setPlatforms] = useState<string[]>(DEFAULT_PLATFORMS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setPlatforms(getStoredPlatforms());
    setIsLoaded(true);

    const handleStorageChange = () => {
      setPlatforms(getStoredPlatforms());
    };

    window.addEventListener(PLATFORMS_CHANGED_EVENT, handleStorageChange);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener(PLATFORMS_CHANGED_EVENT, handleStorageChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const addPlatform = useCallback(
    (name: string): boolean => {
      const trimmed = name.trim();
      if (!trimmed) return false;
      const current = getStoredPlatforms();
      if (current.includes(trimmed)) return false;
      const updated = [...current, trimmed];
      savePlatforms(updated);
      setPlatforms(updated);
      return true;
    },
    []
  );

  const editPlatform = useCallback(
    (oldName: string, newName: string): boolean => {
      const trimmed = newName.trim();
      if (!trimmed || trimmed === oldName) return false;
      const current = getStoredPlatforms();
      const updated = current.map((p) => (p === oldName ? trimmed : p));
      savePlatforms(updated);
      setPlatforms(updated);
      return true;
    },
    []
  );

  const deletePlatform = useCallback(
    (name: string): boolean => {
      const current = getStoredPlatforms();
      const updated = current.filter((p) => p !== name);
      savePlatforms(updated);
      setPlatforms(updated);
      return true;
    },
    []
  );

  const resetPlatforms = useCallback(() => {
    savePlatforms(DEFAULT_PLATFORMS);
    setPlatforms(DEFAULT_PLATFORMS);
  }, []);

  return {
    platforms,
    isLoaded,
    addPlatform,
    editPlatform,
    deletePlatform,
    resetPlatforms,
  };
}
