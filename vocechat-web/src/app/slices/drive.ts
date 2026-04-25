import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { DriveSavedFile } from "@/utils/google-drive/state";
import type { PickedFolder } from "@/utils/google-drive";

export interface DriveState {
  /** 預設儲存資料夾 */
  folder: PickedFolder | null;
  /** fileKey -> saved info */
  savedFiles: Record<string, DriveSavedFile>;
  /** 目前正在從 Drive 拉狀態 */
  loading: boolean;
  /** 是否已成功載入過至少一次（避免初次空 state 被誤認為「尚未儲存」）*/
  initialized: boolean;
  /** 最近一次錯誤 */
  error: string | null;
}

const initialState: DriveState = {
  folder: null,
  savedFiles: {},
  loading: false,
  initialized: false,
  error: null
};

const driveSlice = createSlice({
  name: "drive",
  initialState,
  reducers: {
    setDriveFolder(state, action: PayloadAction<PickedFolder | null>) {
      state.folder = action.payload;
      // 換資料夾後狀態要重抓
      state.savedFiles = {};
      state.initialized = false;
    },
    setDriveLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setDriveError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    /** 整批替換（從 Drive 拉回時用） */
    setDriveSavedFiles(state, action: PayloadAction<Record<string, DriveSavedFile>>) {
      state.savedFiles = action.payload;
      state.initialized = true;
    },
    /** 加一筆紀錄 */
    addDriveSavedFile(
      state,
      action: PayloadAction<{ fileKey: string; info: DriveSavedFile }>
    ) {
      state.savedFiles[action.payload.fileKey] = action.payload.info;
    },
    /** 移除一筆紀錄 */
    removeDriveSavedFile(state, action: PayloadAction<string>) {
      delete state.savedFiles[action.payload];
    },
    /** 重置整個 slice（登出 / 撤銷授權時用） */
    resetDrive() {
      return initialState;
    }
  }
});

export const {
  setDriveFolder,
  setDriveLoading,
  setDriveError,
  setDriveSavedFiles,
  addDriveSavedFile,
  removeDriveSavedFile,
  resetDrive
} = driveSlice.actions;

export default driveSlice.reducer;
