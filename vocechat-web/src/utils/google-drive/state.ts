import { driveFetch } from "./api";
import { uploadToDrive } from "./upload";

export const STATE_FILENAME = ".adam-chat-state.json";

export type DriveSavedFile = {
  driveFileId: string;
  driveFolderId: string;
  fileName: string;
  savedAt: number;
  webViewLink?: string;
};

export type DriveAppState = {
  version: 1;
  savedFiles: Record<string, DriveSavedFile>;
  // 跨裝置同步「已知 404 / 已驗證 200」的檔案 path → discoveredAt timestamp
  // 這樣手機標過的 expired，桌機進來就不用再探測一次。
  expiredFiles?: Record<string, number>;
  validatedFiles?: Record<string, number>;
};

const EMPTY_STATE: DriveAppState = { version: 1, savedFiles: {} };

/** 在指定資料夾搜尋狀態檔，回傳 fileId 或 null */
async function findStateFileId(folderId: string): Promise<string | null> {
  const q =
    `name = '${STATE_FILENAME}' and ` +
    `'${folderId}' in parents and trashed = false`;
  const res = await driveFetch<{ files: { id: string; name: string }[] }>(
    `/drive/v3/files?q=${encodeURIComponent(q)}&fields=${encodeURIComponent(
      "files(id,name)"
    )}&pageSize=1`
  );
  return res.files?.[0]?.id ?? null;
}

/** 讀取 Drive 上的狀態檔；不存在則回傳空狀態 */
export async function loadDriveState(folderId: string): Promise<DriveAppState> {
  const fileId = await findStateFileId(folderId);
  if (!fileId) return { ...EMPTY_STATE };

  const data = await driveFetch<string | DriveAppState>(
    `/drive/v3/files/${fileId}?alt=media`
  );
  let parsed: any;
  if (typeof data === "string") {
    try {
      parsed = JSON.parse(data);
    } catch {
      return { ...EMPTY_STATE };
    }
  } else {
    parsed = data;
  }
  if (!parsed || typeof parsed !== "object") return { ...EMPTY_STATE };
  return {
    version: 1,
    savedFiles: parsed.savedFiles ?? {},
    expiredFiles: parsed.expiredFiles ?? {},
    validatedFiles: parsed.validatedFiles ?? {}
  };
}

/** 把狀態存回 Drive；自動處理 create / update */
export async function saveDriveState(
  folderId: string,
  state: DriveAppState
): Promise<void> {
  const fileId = await findStateFileId(folderId);
  const body = JSON.stringify(state);

  if (fileId) {
    // 更新既有檔
    await driveFetch(
      `/upload/drive/v3/files/${fileId}?uploadType=media`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body
      }
    );
  } else {
    // 第一次建立
    const blob = new Blob([body], { type: "application/json" });
    await uploadToDrive({
      blob,
      fileName: STATE_FILENAME,
      folderId,
      mimeType: "application/json"
    });
  }
}
