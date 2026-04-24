import { useEffect, useState, useCallback } from "react";
import { shallowEqual } from "react-redux";
import { useAppSelector } from "@/app/store";

const EVENT_KEY = "user_pref_change";
const PREFIX = "pref";

const sweptUids = new Set<number>();
const sweepOrphanPrefs = (currentUid: number) => {
  if (!currentUid || sweptUids.has(currentUid)) return;
  sweptUids.add(currentUid);
  try {
    const orphans: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith(`${PREFIX}:`)) continue;
      const uidPart = k.split(":")[1];
      if (uidPart && uidPart !== String(currentUid)) orphans.push(k);
    }
    orphans.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* quota or disabled — silent */
  }
};

/**
 * Abstraction layer for per-user preferences.
 *
 * Current: localStorage keyed by UID (so switching accounts on same device keeps them separate).
 * Future (after backend fork adds user.extra JSON bag): swap internals to API call.
 *
 * Consumers keep using the same [value, setValue] shape.
 */
export function useUserPref<T>(key: string, defaultValue: T): [T, (v: T) => void] {
  const uid = useAppSelector((s) => s.authData.user?.uid ?? 0, shallowEqual);
  const storageKey = `${PREFIX}:${uid}:${key}`;

  useEffect(() => {
    sweepOrphanPrefs(uid);
  }, [uid]);

  const read = useCallback((): T => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw == null) return defaultValue;
      return JSON.parse(raw) as T;
    } catch {
      return defaultValue;
    }
  }, [storageKey, defaultValue]);

  const [value, setValue] = useState<T>(read);

  useEffect(() => {
    setValue(read());
  }, [read]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { storageKey?: string };
      if (detail?.storageKey === storageKey) setValue(read());
    };
    window.addEventListener(EVENT_KEY, handler);
    return () => window.removeEventListener(EVENT_KEY, handler);
  }, [storageKey, read]);

  const set = useCallback(
    (v: T) => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(v));
      } catch {
        /* quota or disabled — silent */
      }
      window.dispatchEvent(new CustomEvent(EVENT_KEY, { detail: { storageKey } }));
    },
    [storageKey]
  );

  return [value, set];
}
