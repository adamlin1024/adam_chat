import { useEffect, useRef } from "react";

import { useUserPref } from "./useUserPref";
import { loadDriveState, saveDriveState } from "@/utils/google-drive/state";
import { getStoredToken, type PickedFolder } from "@/utils/google-drive";

const FOLDER_PREF_KEY = "drive_default_folder";
const EXPIRED_KEY = "EXPIRED_FILES_MAP";
const VALIDATED_KEY = "VALIDATED_FILES_MAP";
const SYNC_EVENT = "expired-files-map-changed";

type StrMap = Record<string, number>;

const safeRead = (key: string): StrMap => {
  try {
    return JSON.parse(localStorage.getItem(key) || "{}") as StrMap;
  } catch {
    return {};
  }
};

const safeWrite = (key: string, m: StrMap) => {
  try {
    localStorage.setItem(key, JSON.stringify(m));
  } catch {
    /* ignore */
  }
};

/** 兩個 map 取聯集（以較大的 timestamp 為主）。永遠不刪 expired 紀錄 */
const mergeMap = (a: StrMap, b: StrMap): StrMap => {
  const out: StrMap = { ...a };
  for (const k in b) {
    if (!out[k] || b[k] > out[k]) out[k] = b[k];
  }
  return out;
};

/**
 * App-level 鉤子：把本機 EXPIRED / VALIDATED 名單與 Drive 的 .adam-chat-state.json
 * 雙向同步。
 *
 * 只有 Drive token 存在 + 預設資料夾已設定才會啟動。
 *
 * 流程：
 * 1. mount 時讀 Drive state → 與本機 merge → 寫回 localStorage + 派發事件
 * 2. 監聽 SYNC_EVENT（本機 expired/validated 有變動）→ debounce 800ms 寫回 Drive
 *
 * 沒接 Drive 時：什麼都不做，本機 localStorage 自己跑。
 */
const useDriveExpiredSync = () => {
  const [folder] = useUserPref<PickedFolder | null>(FOLDER_PREF_KEY, null);
  const folderId = folder?.id ?? null;
  const writeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const writeInflightRef = useRef(false);

  // 1. 啟動時 / 換資料夾時，從 Drive 拉一次合併
  useEffect(() => {
    if (!folderId) return;
    if (!getStoredToken()) return;
    let cancelled = false;
    (async () => {
      try {
        const remote = await loadDriveState(folderId);
        if (cancelled) return;
        const localExpired = safeRead(EXPIRED_KEY);
        const localValidated = safeRead(VALIDATED_KEY);
        const mergedExpired = mergeMap(localExpired, remote.expiredFiles ?? {});
        const mergedValidated = mergeMap(localValidated, remote.validatedFiles ?? {});
        // expired 優先 — 如果 path 在 expired 內，從 validated 移除
        for (const k in mergedExpired) {
          if (mergedValidated[k]) delete mergedValidated[k];
        }
        safeWrite(EXPIRED_KEY, mergedExpired);
        safeWrite(VALIDATED_KEY, mergedValidated);
        window.dispatchEvent(new Event(SYNC_EVENT));
      } catch {
        /* Drive 暫時連不上不致命，下次再試 */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [folderId]);

  // 2. 本機有變動 → debounce 寫回 Drive
  useEffect(() => {
    if (!folderId) return;

    const flush = async () => {
      if (writeInflightRef.current) {
        // 排隊（簡單版：寫完後若還有新事件，下次 flush 會帶上最新值）
        return;
      }
      if (!getStoredToken()) return;
      writeInflightRef.current = true;
      try {
        // 重新讀 Drive 拿到 savedFiles，避免覆寫掉 useDriveSavedState 寫的部分
        const remote = await loadDriveState(folderId);
        const localExpired = safeRead(EXPIRED_KEY);
        const localValidated = safeRead(VALIDATED_KEY);
        const mergedExpired = mergeMap(remote.expiredFiles ?? {}, localExpired);
        const mergedValidated = mergeMap(remote.validatedFiles ?? {}, localValidated);
        for (const k in mergedExpired) {
          if (mergedValidated[k]) delete mergedValidated[k];
        }
        await saveDriveState(folderId, {
          version: 1,
          savedFiles: remote.savedFiles ?? {},
          expiredFiles: mergedExpired,
          validatedFiles: mergedValidated
        });
      } catch {
        /* 暫時失敗下次再寫 */
      } finally {
        writeInflightRef.current = false;
      }
    };

    const handler = () => {
      if (writeTimerRef.current) clearTimeout(writeTimerRef.current);
      writeTimerRef.current = setTimeout(flush, 800);
    };
    window.addEventListener(SYNC_EVENT, handler);
    return () => {
      window.removeEventListener(SYNC_EVENT, handler);
      if (writeTimerRef.current) clearTimeout(writeTimerRef.current);
    };
  }, [folderId]);
};

export default useDriveExpiredSync;
