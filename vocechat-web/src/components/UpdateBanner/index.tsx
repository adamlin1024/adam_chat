import { useEffect, useState } from "react";

import { applyUpdate } from "@/serviceWorkerRegistration";

const DISMISS_KEY = "update_banner_dismissed_at";
const DISMISS_TTL = 6 * 60 * 60 * 1000; // 6 小時內按過「稍後」就不再煩

export default function UpdateBanner() {
  const [visible, setVisible] = useState(false);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
    const onUpdateReady = () => {
      // 距離上次「稍後」太近就先不顯示，但還是會在 controllerchange 時 reload
      if (Date.now() - dismissedAt < DISMISS_TTL) return;
      setVisible(true);
    };
    window.addEventListener("app-update-ready", onUpdateReady);
    return () => window.removeEventListener("app-update-ready", onUpdateReady);
  }, []);

  if (!visible) return null;

  const onApply = () => {
    setApplying(true);
    applyUpdate(); // controllerchange listener 會處理 reload
  };
  const onDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[10000] w-[calc(100%-2rem)] max-w-md">
      <div className="bg-bg-elevated border border-border shadow-dropdown rounded-xl p-3 flex items-center gap-3">
        <div className="shrink-0 w-9 h-9 rounded-full bg-accent/10 text-accent flex-center">
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 1 1-3-6.7" />
            <path d="M21 4v5h-5" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-fg-primary">有新版本可用</div>
          <div className="text-xs text-fg-subtle mt-0.5">
            點下「重新載入」即時套用最新功能
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-1.5">
          <button
            onClick={onDismiss}
            disabled={applying}
            className="px-2.5 py-1.5 text-xs text-fg-subtle hover:text-fg-primary transition-colors disabled:opacity-40"
          >
            稍後
          </button>
          <button
            onClick={onApply}
            disabled={applying}
            className="px-3 py-1.5 text-xs font-medium text-white bg-accent hover:bg-accent/90 rounded-md transition-colors disabled:opacity-40"
          >
            {applying ? "套用中…" : "重新載入"}
          </button>
        </div>
      </div>
    </div>
  );
}
