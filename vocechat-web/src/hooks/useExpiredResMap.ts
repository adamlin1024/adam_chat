import { useCallback, useEffect, useState } from "react";

const LOCAL_KEY = `EXPIRED_FILES_MAP`;
// 同一 tab 內多個元件共用 expired 名單時，rooks useLocalstorageState 不會 cross-instance
// 同步（storage event 只跨 tab 不跨同 tab 元件）。所以自己派發 custom event 通知所有
// useExpiredResMap 實例重讀 localStorage，避免「ImagePreview 標 expired 了，但
// files/index.tsx 的過濾 hook 實例完全不知道」這種 stale state。
const SYNC_EVENT = "expired-files-map-changed";

const readMap = (): Record<string, number> => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || "{}") as Record<string, number>;
  } catch {
    return {};
  }
};

const writeMap = (map: Record<string, number>) => {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(map));
  } catch {
    /* quota / private mode 等狀況靜默吞掉 */
  }
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
  const [map, setMap] = useState<Record<string, number>>(readMap);

  useEffect(() => {
    const handler = () => setMap(readMap());
    window.addEventListener(SYNC_EVENT, handler);
    // 跨 tab 也順便同步（同 tab 不會觸發此事件）
    window.addEventListener("storage", (e) => {
      if (e.key === LOCAL_KEY || e.key === null) handler();
    });
    return () => {
      window.removeEventListener(SYNC_EVENT, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const setExpired = useCallback((url: string) => {
    const key = extractKey(url);
    if (!key) return;
    const curr = readMap();
    if (curr[key]) return;
    curr[key] = Date.now();
    writeMap(curr);
  }, []);

  const isExpired = useCallback(
    (url: string) => {
      const key = extractKey(url);
      if (!key) return false;
      return !!map[key];
    },
    [map]
  );

  const clearExpired = useCallback(() => {
    try {
      localStorage.removeItem(LOCAL_KEY);
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new Event(SYNC_EVENT));
  }, []);

  return { setExpired, isExpired, clearExpired };
};

export default useExpiredResMap;
