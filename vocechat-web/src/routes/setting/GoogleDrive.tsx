import { useState } from "react";
import toast from "react-hot-toast";

import {
  clearStoredToken,
  hasRawStoredToken,
  pickFolder,
  requestAccessToken,
  revokeAccess
} from "@/utils/google-drive";
import { useDriveSavedState } from "@/hooks/useDriveSavedState";

export default function GoogleDriveSetting() {
  const { folder, setFolder, state, loading, refresh, unmarkSaved, reset } =
    useDriveSavedState();
  // 只要 raw token 還在就視為「已連動」，不論是否在 1 小時內。
  // GIS 沒有真正的前端 silent refresh 能力（Chrome 第三方 cookies + popup blocker），
  // 過期續約交給使用者下一次操作（user gesture 內 popup 通常一閃即逝）。
  const [tokenStatus, setTokenStatus] = useState(() =>
    hasRawStoredToken() ? "已授權" : "未授權"
  );
  const [busy, setBusy] = useState(false);

  const onConnect = async () => {
    setBusy(true);
    try {
      await requestAccessToken({ prompt: "consent" });
      setTokenStatus("已授權");
      toast.success("已連動 Google Drive");
      await refresh({ fromUserGesture: true });
    } catch (e: any) {
      toast.error(`連動失敗：${e.message ?? e}`);
    } finally {
      setBusy(false);
    }
  };

  const onPickFolder = async () => {
    setBusy(true);
    try {
      const picked = await pickFolder();
      if (picked) {
        setFolder(picked);
        toast.success(`預設資料夾：${picked.name}`);
      }
    } catch (e: any) {
      toast.error(`選擇失敗：${e.message ?? e}`);
    } finally {
      setBusy(false);
    }
  };

  const onDisconnect = async () => {
    if (!window.confirm("確定要中斷 Google Drive 連動？已儲存的紀錄會清除。"))
      return;
    setBusy(true);
    try {
      await revokeAccess();
      setTokenStatus("未授權");
      reset();
      toast.success("已中斷連動");
    } catch (e: any) {
      toast.error(`中斷失敗：${e.message ?? e}`);
    } finally {
      setBusy(false);
    }
  };

  const onClearLocalToken = () => {
    clearStoredToken();
    setTokenStatus("未授權");
    toast.success("已清除本機 token");
  };

  const onUnmark = async (key: string, fileName: string) => {
    if (
      !window.confirm(
        `刪除「${fileName}」？\n\n這會同時刪除 Drive 上的檔案，無法還原。`
      )
    )
      return;
    setBusy(true);
    try {
      await unmarkSaved(key);
      toast.success("已刪除檔案與紀錄");
    } catch (e: any) {
      toast.error(`刪除失敗：${e.message ?? e}`);
    } finally {
      setBusy(false);
    }
  };

  const button =
    "px-3 py-2 rounded-md text-sm font-medium border border-border text-fg-primary bg-bg-canvas hover:bg-bg-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors";
  const buttonPrimary =
    "px-3 py-2 rounded-md text-sm font-medium text-accent-on bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors";
  const buttonDanger =
    "px-3 py-2 rounded-md text-sm font-medium border border-danger/40 text-danger bg-bg-canvas hover:bg-danger/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors";

  const savedEntries = Object.entries(state.savedFiles);
  const isAuthed = tokenStatus === "已授權";

  // 桌機才有卡片底色 / padding；手機 padding 由外層 p-4 提供，避免內外重疊造成不對齊
  const SECTION =
    "w-full md:w-[512px] md:p-6 md:rounded-xl md:bg-bg-elevated md:border md:border-border-subtle";

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col items-start gap-5 md:gap-6">
        {/* Header */}
        <header className="w-full md:w-[512px]">
          <h2 className="text-lg font-bold text-fg-primary">Google Drive 連動</h2>
          <p className="text-sm text-fg-subtle mt-1.5 leading-relaxed">
            連動後可把訊息附件、收藏、檔案管理頁中的檔案儲存到你指定的 Drive
            資料夾。狀態檔（.adam-chat-state.json）儲存在同一個資料夾，跨裝置共用。
          </p>
        </header>

        {/* 狀態 + 操作 */}
        <section className={SECTION}>
          {/* 狀態列 */}
          <dl className="text-sm divide-y divide-border-subtle">
            <div className="flex items-center justify-between gap-3 py-2.5 first:pt-0">
              <dt className="text-fg-muted">授權狀態</dt>
              <dd className="text-fg-primary font-medium truncate">
                {tokenStatus}
                {loading && (
                  <span className="text-fg-muted text-xs ml-2">同步中…</span>
                )}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3 py-2.5">
              <dt className="text-fg-muted">預設資料夾</dt>
              <dd className="text-fg-primary font-medium truncate">
                {folder?.name ?? (
                  <span className="text-fg-muted font-normal">尚未選擇</span>
                )}
              </dd>
            </div>
          </dl>

          {/* 主要動作 */}
          <div className="pt-4">
            {!isAuthed ? (
              <button
                className={buttonPrimary}
                onClick={onConnect}
                disabled={busy}
              >
                連動 Google Drive
              </button>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button
                  className={button}
                  onClick={onPickFolder}
                  disabled={busy}
                >
                  {folder ? "變更資料夾" : "選擇資料夾"}
                </button>
                <button
                  className={button}
                  onClick={() => refresh({ fromUserGesture: true })}
                  disabled={busy || !folder}
                >
                  從 Drive 重新載入
                </button>
              </div>
            )}
          </div>

          {/* 危險區（中斷連動 / 清除 token） */}
          {isAuthed && (
            <div className="mt-5 pt-4 border-t border-border-subtle space-y-3">
              <div>
                <button
                  className={buttonDanger}
                  onClick={onDisconnect}
                  disabled={busy}
                >
                  中斷連動
                </button>
                <p className="text-xs text-fg-muted mt-1.5">
                  撤銷 Google Drive 授權並清除已儲存紀錄。
                </p>
              </div>
              <button
                className="text-xs text-fg-muted hover:text-fg-primary transition-colors"
                onClick={onClearLocalToken}
              >
                清除本機 token（不會撤銷遠端授權）
              </button>
            </div>
          )}
        </section>

        {/* 已儲存清單 */}
        <section className={SECTION}>
          <div className="flex items-center justify-between gap-2 mb-3">
            <h3 className="text-sm font-medium text-fg-primary">
              已儲存紀錄（{savedEntries.length}）
            </h3>
            <span className="text-xs text-fg-muted shrink-0">跨裝置同步</span>
          </div>
          {savedEntries.length === 0 ? (
            <div className="text-xs text-fg-muted py-8 text-center">
              還沒有任何儲存紀錄
            </div>
          ) : (
            <ul className="divide-y divide-border-subtle max-h-96 overflow-auto -mx-1">
              {savedEntries.map(([key, info]) => (
                <li
                  key={key}
                  className="flex items-center gap-2 text-xs px-1 py-2.5"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-fg-primary truncate font-medium">
                      {info.fileName}
                    </div>
                    <div className="text-fg-muted truncate mt-0.5">
                      {new Date(info.savedAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {info.webViewLink && (
                      <a
                        href={info.webViewLink}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2 py-1 rounded text-accent hover:bg-bg-hover transition-colors"
                      >
                        開啟
                      </a>
                    )}
                    <button
                      className="px-2 py-1 rounded text-fg-muted hover:text-danger hover:bg-bg-hover transition-colors disabled:opacity-40"
                      onClick={() => onUnmark(key, info.fileName)}
                      disabled={busy}
                    >
                      刪除
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
