import { useState } from "react";

import SettingBlock from "@/components/SettingBlock";
import { forceClearAndReload } from "@/serviceWorkerRegistration";

const ForceUpdate = () => {
  const [busy, setBusy] = useState(false);

  const onClick = async () => {
    if (
      !window.confirm(
        "強制清除快取並重新載入？這會註銷 Service Worker、清空所有暫存檔案，等同於清除瀏覽器資料後重新開啟 App。"
      )
    )
      return;
    setBusy(true);
    await forceClearAndReload();
    // 上面會 reload，這行通常不會執行到
  };

  return (
    <SettingBlock
      title="強制更新 App"
      desc="當畫面看起來卡在舊版時，按這裡會清掉快取與 Service Worker 並重整。"
      toggler={
        <button
          type="button"
          onClick={onClick}
          disabled={busy}
          className="px-3 py-1.5 text-xs font-medium border border-border text-fg-primary bg-bg-canvas hover:bg-bg-hover rounded-md transition-colors disabled:opacity-40"
        >
          {busy ? "清除中…" : "立即更新"}
        </button>
      }
    />
  );
};

export default ForceUpdate;
