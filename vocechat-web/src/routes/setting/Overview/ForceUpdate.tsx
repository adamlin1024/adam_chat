import { useState } from "react";

import SettingBlock from "@/components/SettingBlock";
import { forceClearAndReload } from "@/serviceWorkerRegistration";

const ForceUpdate = () => {
  const [busy, setBusy] = useState(false);

  const onClick = async () => {
    setBusy(true);
    await forceClearAndReload();
    // 上面會 reload，這行通常不會執行到
  };

  return (
    <SettingBlock
      title="立即更新 App"
      desc="當畫面看起來卡在舊版時，按這裡會去 server 拉最新版本並重整。不會清掉登入、Google Drive 授權、訊息快取等資料。"
      toggler={
        <button
          type="button"
          onClick={onClick}
          disabled={busy}
          className="shrink-0 whitespace-nowrap px-3 py-1.5 text-xs font-medium border border-border text-fg-primary bg-bg-canvas hover:bg-bg-hover rounded-md transition-colors disabled:opacity-40"
        >
          {busy ? "清除中…" : "立即更新"}
        </button>
      }
    />
  );
};

export default ForceUpdate;
