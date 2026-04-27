import { useState } from "react";
import toast from "react-hot-toast";
import clsx from "clsx";
import { useTranslation } from "react-i18next";

import { useDriveSavedState } from "@/hooks/useDriveSavedState";
import {
  clearStoredToken,
  DriveAccountMismatchError,
  DriveFolderNotAccessibleError,
  pickFolder,
  requestAccessToken,
  uploadToDrive
} from "@/utils/google-drive";

type Props = {
  /** 穩定識別字（同一份檔案在不同位置都用同一個 key） */
  fileKey: string;
  /** 下載 URL（會 fetch blob 上傳） */
  downloadUrl: string;
  fileName: string;
  mimeType?: string;
  /** 額外 className（給容器） */
  className?: string;
  /** icon 大小，預設 size-6 */
  iconClassName?: string;
};

type Status = "idle" | "uploading" | "error";

const CloudUploadIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.5 19a4.5 4.5 0 0 0 0-9 6 6 0 0 0-11.7-1.5A4.5 4.5 0 0 0 6.5 19" />
    <path d="M12 12v8" />
    <path d="m9 15 3-3 3 3" />
  </svg>
);

const CloudCheckIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.5 19a4.5 4.5 0 0 0 0-9 6 6 0 0 0-11.7-1.5A4.5 4.5 0 0 0 6.5 19" />
    <path d="m9 14 2 2 4-4" />
  </svg>
);

const SpinnerIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={clsx("animate-spin", className)} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M21 12a9 9 0 1 1-6.2-8.55" />
  </svg>
);

const SaveToCloudButton = ({
  fileKey,
  downloadUrl,
  fileName,
  mimeType,
  className,
  iconClassName = "size-6"
}: Props) => {
  const { t } = useTranslation("common");
  const { folder, setFolder, isSaved, getSaved, markSaved } = useDriveSavedState();
  const [status, setStatus] = useState<Status>("idle");

  const saved = isSaved(fileKey);
  const savedInfo = getSaved(fileKey);

  const handleClick = async () => {
    // 已儲存 → 開 Drive 連結
    if (saved && savedInfo?.webViewLink) {
      window.open(savedInfo.webViewLink, "_blank", "noopener,noreferrer");
      return;
    }
    if (status === "uploading") return;

    setStatus("uploading");
    try {
      // 1. 確保授權
      await requestAccessToken();

      // 2. 確保有預設資料夾
      let target = folder;
      if (!target) {
        const picked = await pickFolder();
        if (!picked) {
          setStatus("idle");
          return; // 使用者取消
        }
        setFolder(picked);
        target = picked;
      }

      // 3. 抓 blob
      const res = await fetch(downloadUrl, { credentials: "include" });
      if (!res.ok) throw new Error(`下載失敗 ${res.status}`);
      const blob = await res.blob();

      // 4. 上傳
      const result = await uploadToDrive({
        blob,
        fileName,
        folderId: target.id,
        mimeType: mimeType || blob.type || undefined
      });

      // 5. 寫入狀態檔
      await markSaved(fileKey, {
        driveFileId: result.id,
        driveFolderId: target.id,
        fileName: result.name,
        savedAt: Date.now(),
        webViewLink: result.webViewLink
      });

      setStatus("idle");
      toast.success(`已儲存到 Drive：${target.name}`);
    } catch (e: any) {
      console.error("[SaveToCloudButton]", e);
      setStatus("error");
      if (e instanceof DriveAccountMismatchError) {
        toast.error(
          `${t("tip.drive_account_mismatch_title")} — ${t("tip.drive_account_mismatch_desc", {
            bound: e.boundName,
            picked: e.pickedName
          })}`,
          { duration: 6000 }
        );
      } else if (e instanceof DriveFolderNotAccessibleError) {
        // 帳號跟綁定資料夾對不到 → 清掉錯帳號的 token + bound_user，
        // 使用者再點一次上傳就會重新跳 popup、可以挑正確帳號。
        clearStoredToken();
        toast.error(
          `${t("tip.drive_folder_not_accessible_title")} — ${t("tip.drive_folder_not_accessible_desc")}`,
          { duration: 8000 }
        );
      } else {
        toast.error(`儲存失敗：${e.message ?? e}`);
      }
      setTimeout(() => setStatus("idle"), 2000);
    }
  };

  // 強制狀態色（saved / uploading）覆蓋外層傳入的 className text color
  const forcedColor =
    status === "uploading" || saved ? "!text-accent hover:!text-accent" : "";

  const ariaLabel = saved
    ? "已儲存到 Drive"
    : status === "uploading"
      ? "儲存中"
      : "儲存到 Google Drive";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={status === "uploading"}
      className={clsx(
        "whitespace-nowrap transition-colors",
        status === "uploading" && "cursor-wait",
        className,
        forcedColor
      )}
      aria-label={ariaLabel}
    >
      {status === "uploading" ? (
        <SpinnerIcon className={clsx(iconClassName, "stroke-current")} />
      ) : saved ? (
        <CloudCheckIcon className={clsx(iconClassName, "stroke-current")} />
      ) : (
        <CloudUploadIcon className={clsx(iconClassName, "stroke-current")} />
      )}
    </button>
  );
};

export default SaveToCloudButton;
