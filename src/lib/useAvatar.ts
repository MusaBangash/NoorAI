"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "noorai-avatar";

/**
 * Shared, localStorage-backed avatar — same "mock persistence" pattern
 * as ThemeToggle, so a photo picked in Settings shows up in the
 * sidebar too, without a real backend yet.
 */
export function useAvatar() {
  const [avatar, setAvatarState] = useState<string | null>(null);

  useEffect(() => {
    try {
      setAvatarState(window.localStorage.getItem(STORAGE_KEY));
    } catch {
      // localStorage unavailable (private mode) — avatar just won't persist
    }
  }, []);

  function setAvatar(dataUrl: string | null) {
    setAvatarState(dataUrl);
    try {
      if (dataUrl) window.localStorage.setItem(STORAGE_KEY, dataUrl);
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore — same fallback as above
    }
  }

  return [avatar, setAvatar] as const;
}
