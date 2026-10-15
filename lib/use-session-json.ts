"use client";

import { useMemo, useSyncExternalStore } from "react";

function subscribe() {
  return () => undefined;
}

export function useSessionJson<T>(key: string): T | null {
  const raw = useSyncExternalStore(
    subscribe,
    () => sessionStorage.getItem(key),
    () => null,
  );

  return useMemo(() => {
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }, [raw]);
}

