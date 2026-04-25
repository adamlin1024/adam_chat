import { useCallback, useEffect, useMemo, useRef } from "react";
import { shallowEqual } from "react-redux";

import { useAppDispatch, useAppSelector } from "@/app/store";
import {
  addDriveSavedFile,
  removeDriveSavedFile,
  resetDrive,
  setDriveError,
  setDriveFolder,
  setDriveLoading,
  setDriveSavedFiles
} from "@/app/slices/drive";
import { useUserPref } from "./useUserPref";
import {
  loadDriveState,
  saveDriveState,
  type DriveSavedFile
} from "@/utils/google-drive/state";
import {
  deleteDriveFile,
  getStoredToken,
  type PickedFolder
} from "@/utils/google-drive";

const FOLDER_PREF_KEY = "drive_default_folder";
const BROADCAST_CHANNEL = "adam-chat-drive";

/**
 * 序列化所有 saveDriveState 寫入，避免兩次 markSaved 互相覆蓋。
 * Tail-promise 鏈：每次新動作都接在最後一個之後。
 */
let writeQueue: Promise<void> = Promise.resolve();
function enqueueWrite(task: () => Promise<void>): Promise<void> {
  const next = writeQueue.then(task, task);
  // 不讓單次失敗污染後續鏈
  writeQueue = next.catch(() => undefined);
  return next;
}

/** 跨 tab 廣播（同 origin 同瀏覽器多分頁） */
const channel: BroadcastChannel | null =
  typeof BroadcastChannel !== "undefined"
    ? new BroadcastChannel(BROADCAST_CHANNEL)
    : null;
type BroadcastMsg =
  | { type: "saved"; fileKey: string; info: DriveSavedFile }
  | { type: "unsaved"; fileKey: string }
  | { type: "snapshot"; map: Record<string, DriveSavedFile> }
  | { type: "folder"; folder: PickedFolder | null };

export function useDriveSavedState() {
  const dispatch = useAppDispatch();
  const folderPref = useUserPref<PickedFolder | null>(FOLDER_PREF_KEY, null);
  const [folder, setFolderPref] = folderPref;

  const drive = useAppSelector((s) => s.drive, shallowEqual);
  const lastFolderId = useRef<string | null>(null);

  // 同步 useUserPref 的 folder → Redux
  useEffect(() => {
    if (drive.folder?.id !== folder?.id || drive.folder?.name !== folder?.name) {
      dispatch(setDriveFolder(folder ?? null));
    }
  }, [folder, drive.folder?.id, drive.folder?.name, dispatch]);

  // folder 改變時自動 refresh
  const refresh = useCallback(async () => {
    if (!folder?.id) {
      dispatch(setDriveSavedFiles({}));
      return;
    }
    if (!getStoredToken()) {
      dispatch(setDriveSavedFiles({}));
      return;
    }
    dispatch(setDriveLoading(true));
    dispatch(setDriveError(null));
    try {
      const next = await loadDriveState(folder.id);
      dispatch(setDriveSavedFiles(next.savedFiles));
      channel?.postMessage({
        type: "snapshot",
        map: next.savedFiles
      } as BroadcastMsg);
    } catch (e: any) {
      dispatch(setDriveError(e?.message ?? String(e)));
    } finally {
      dispatch(setDriveLoading(false));
    }
  }, [folder?.id, dispatch]);

  useEffect(() => {
    if (lastFolderId.current === (folder?.id ?? null)) return;
    lastFolderId.current = folder?.id ?? null;
    refresh();
  }, [folder?.id, refresh]);

  // 跨 tab 訊息接收
  useEffect(() => {
    if (!channel) return;
    const handler = (e: MessageEvent<BroadcastMsg>) => {
      const msg = e.data;
      if (!msg) return;
      switch (msg.type) {
        case "saved":
          dispatch(addDriveSavedFile({ fileKey: msg.fileKey, info: msg.info }));
          break;
        case "unsaved":
          dispatch(removeDriveSavedFile(msg.fileKey));
          break;
        case "snapshot":
          dispatch(setDriveSavedFiles(msg.map));
          break;
        case "folder":
          // 別 tab 換資料夾，這 tab 也跟著（仍由 useUserPref 的 storage 同步機制驅動）
          break;
      }
    };
    channel.addEventListener("message", handler);
    return () => channel.removeEventListener("message", handler);
  }, [dispatch]);

  /** 寫入 Drive：佇列化，不會兩次同時呼叫 */
  const persistTo = useCallback(
    (folderId: string, savedFiles: Record<string, DriveSavedFile>) =>
      enqueueWrite(() =>
        saveDriveState(folderId, { version: 1, savedFiles })
      ),
    []
  );

  const markSaved = useCallback(
    async (fileKey: string, info: DriveSavedFile) => {
      if (!folder?.id) throw new Error("尚未選擇 Drive 資料夾");
      // 先 optimistic 更新
      dispatch(addDriveSavedFile({ fileKey, info }));
      channel?.postMessage({ type: "saved", fileKey, info } as BroadcastMsg);
      // 取最新 savedFiles 寫回
      const nextMap = { ...drive.savedFiles, [fileKey]: info };
      try {
        await persistTo(folder.id, nextMap);
      } catch (e) {
        // 失敗回滾
        dispatch(removeDriveSavedFile(fileKey));
        channel?.postMessage({ type: "unsaved", fileKey } as BroadcastMsg);
        throw e;
      }
    },
    [folder?.id, drive.savedFiles, dispatch, persistTo]
  );

  /**
   * 移除一筆儲存紀錄。
   * 預設同時刪除 Drive 上的實體檔案（deleteFile=true）。
   * 若只想清掉紀錄不動 Drive，傳 deleteFile=false。
   */
  const unmarkSaved = useCallback(
    async (fileKey: string, opts: { deleteFile?: boolean } = {}) => {
      const deleteFile = opts.deleteFile ?? true;
      if (!folder?.id) return;
      const prevInfo = drive.savedFiles[fileKey];
      if (!prevInfo) return;

      // 1. 先刪 Drive 上的實體檔（失敗中斷 — 因為使用者預期是「真的刪掉」）
      if (deleteFile) {
        try {
          await deleteDriveFile(prevInfo.driveFileId);
        } catch (e: any) {
          // 404（檔案在 Drive 已被使用者手動刪掉）視為成功，繼續清紀錄
          const msg = String(e?.message ?? e);
          if (!/\b404\b/.test(msg)) throw e;
        }
      }

      // 2. 再清掉本地紀錄 + 同步到 Drive 狀態檔
      dispatch(removeDriveSavedFile(fileKey));
      channel?.postMessage({ type: "unsaved", fileKey } as BroadcastMsg);
      const nextMap = { ...drive.savedFiles };
      delete nextMap[fileKey];
      try {
        await persistTo(folder.id, nextMap);
      } catch (e) {
        // 狀態檔回寫失敗 — 紀錄回滾，但 Drive 檔案已刪
        dispatch(addDriveSavedFile({ fileKey, info: prevInfo }));
        channel?.postMessage({
          type: "saved",
          fileKey,
          info: prevInfo
        } as BroadcastMsg);
        throw e;
      }
    },
    [folder?.id, drive.savedFiles, dispatch, persistTo]
  );

  const setFolder = useCallback(
    (next: PickedFolder | null) => {
      setFolderPref(next);
      channel?.postMessage({ type: "folder", folder: next } as BroadcastMsg);
    },
    [setFolderPref]
  );

  const reset = useCallback(() => {
    dispatch(resetDrive());
    setFolderPref(null);
  }, [dispatch, setFolderPref]);

  const isSaved = useCallback(
    (fileKey: string) => Boolean(drive.savedFiles[fileKey]),
    [drive.savedFiles]
  );
  const getSaved = useCallback(
    (fileKey: string) => drive.savedFiles[fileKey] ?? null,
    [drive.savedFiles]
  );

  return useMemo(
    () => ({
      folder,
      setFolder,
      state: { savedFiles: drive.savedFiles, version: 1 as const },
      loading: drive.loading,
      error: drive.error,
      initialized: drive.initialized,
      refresh,
      markSaved,
      unmarkSaved,
      isSaved,
      getSaved,
      reset
    }),
    [
      folder,
      setFolder,
      drive.savedFiles,
      drive.loading,
      drive.error,
      drive.initialized,
      refresh,
      markSaved,
      unmarkSaved,
      isSaved,
      getSaved,
      reset
    ]
  );
}
