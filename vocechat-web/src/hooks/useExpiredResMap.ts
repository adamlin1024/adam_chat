import { useCallback, useEffect, useState } from "react";

const EXPIRED_KEY = `EXPIRED_FILES_MAP`;
const VALIDATED_KEY = `VALIDATED_FILES_MAP`;
// 同一 tab 內多個元件共用名單時，rooks useLocalstorageState 不會 cross-instance
// 同步（瀏覽器原生 storage event 只跨 tab 不跨同 tab 元件）。所以自己派發 custom
// event 通知所有 useExpiredResMap 實例重讀 localStorage。
const SYNC_EVENT = "expired-files-map-changed";

// validated cache 加 TTL：避免 cache 變成 source of truth 然後 drift。
//   expired：死了就是死了，永久（server 端 file path 是 UUID-like 不會被別人 reuse）
//   validated：已驗證 200，但 7 天後重新驗證一次，捕捉「驗過後又被刪」的漂移
const VALIDATED_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type Map = Record<string, number>;

const safeRead = (key: string): Map => {
  try {
    return JSON.parse(localStorage.getItem(key) || "{}") as Map;
  } catch {
    return {};
  }
};

const safeWrite = (key: string, m: Map) => {
  try {
    localStorage.setItem(key, JSON.stringify(m));
  } catch {
    /* quota / private mode 等狀況靜默吞掉 */
  }
};

const broadcast = () => {
  window.dispatchEvent(new Event(SYNC_EVENT));
};

const extractKey = (url: string): string | null => {
  try {
    return new URL(url).searchParams.get("file_path");
  } catch {
    return null;
  }
};

const useExpiredResMap = () => {
  const [expired, setExpiredMap] = useState<Map>(() => safeRead(EXPIRED_KEY));
  const [validated, setValidatedMap] = useState<Map>(() => safeRead(VALIDATED_KEY));

  useEffect(() => {
    const handler = () => {
      setExpiredMap(safeRead(EXPIRED_KEY));
      setValidatedMap(safeRead(VALIDATED_KEY));
    };
    window.addEventListener(SYNC_EVENT, handler);
    const storageHandler = (e: StorageEvent) => {
      if (e.key === EXPIRED_KEY || e.key === VALIDATED_KEY || e.key === null) handler();
    };
    window.addEventListener("storage", storageHandler);
    return () => {
      window.removeEventListener(SYNC_EVENT, handler);
      window.removeEventListener("storage", storageHandler);
    };
  }, []);

  const setExpired = useCallback((url: string) => {
    const key = extractKey(url);
    if (!key) return;
    const curr = safeRead(EXPIRED_KEY);
    if (curr[key]) return;
    curr[key] = Date.now();
    safeWrite(EXPIRED_KEY, curr);
    // 順便從 validated 拔掉（一個 path 不能同時是 ok 又是 404）
    const v = safeRead(VALIDATED_KEY);
    if (v[key]) {
      delete v[key];
      safeWrite(VALIDATED_KEY, v);
    }
    broadcast();
  }, []);

  const setValidated = useCallback((url: string) => {
    const key = extractKey(url);
    if (!key) return;
    const curr = safeRead(VALIDATED_KEY);
    if (curr[key]) return;
    curr[key] = Date.now();
    safeWrite(VALIDATED_KEY, curr);
    broadcast();
  }, []);

  const isExpired = useCallback(
    (url: string) => {
      const key = extractKey(url);
      if (!key) return false;
      return !!expired[key];
    },
    [expired]
  );

  const isValidated = useCallback(
    (url: string) => {
      const key = extractKey(url);
      if (!key) return false;
      const ts = validated[key];
      if (!ts) return false;
      // TTL 過期 → 視為未驗證，FileBox 會重新 HEAD probe（捕捉「驗過後又被刪」的 drift）
      if (Date.now() - ts > VALIDATED_TTL_MS) return false;
      return true;
    },
    [validated]
  );

  const clearExpired = useCallback(() => {
    try {
      localStorage.removeItem(EXPIRED_KEY);
      localStorage.removeItem(VALIDATED_KEY);
    } catch {
      /* ignore */
    }
    broadcast();
  }, []);

  return { setExpired, setValidated, isExpired, isValidated, clearExpired };
};

export default useExpiredResMap;
