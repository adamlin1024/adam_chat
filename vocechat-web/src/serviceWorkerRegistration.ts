// Service Worker registration with explicit update flow:
// - 偵測到新版本 → 透過 'app-update-ready' window event 通知 UI
// - 使用者點下橫幅後 applyUpdate() 把 SW skip waiting，然後 controllerchange 觸發 reload
// - 不再自動 skipWaiting（避免使用者操作中無預警重整）

interface Config {
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
}

const isLocalhost = Boolean(
  window.location.hostname === "localhost" ||
    window.location.hostname === "[::1]" ||
    window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
);

const UPDATE_EVENT = "app-update-ready";

let pendingRegistration: ServiceWorkerRegistration | null = null;
let controllerChangeWired = false;
let updateCheckInterval: ReturnType<typeof setInterval> | null = null;

/** 設置 controllerchange listener：等使用者觸發 SKIP_WAITING 後，這裡會 reload 整頁 */
function wireControllerChange() {
  if (controllerChangeWired) return;
  controllerChangeWired = true;
  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
}

function notifyUpdateReady(registration: ServiceWorkerRegistration) {
  pendingRegistration = registration;
  window.dispatchEvent(new CustomEvent(UPDATE_EVENT, { detail: registration }));
}

export function register(config: Config = {}) {
  if (process.env.NODE_ENV !== "production") return;
  if (!("serviceWorker" in navigator)) return;
  if (isLocalhost) return;

  const publicUrl = new URL(process.env.PUBLIC_URL, window.location.href);
  if (publicUrl.origin !== window.location.origin) return;

  window.addEventListener("load", () => {
    const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;
    registerValidSW(swUrl, config);
  });
}

function registerValidSW(swUrl: string, config: Config) {
  if (!navigator.serviceWorker) return;
  wireControllerChange();

  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      // 如果一開啟就已經有 waiting SW，立即提示
      if (registration.waiting && navigator.serviceWorker.controller) {
        notifyUpdateReady(registration);
        config.onUpdate?.(registration);
      }

      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (!installingWorker) return;
        installingWorker.onstatechange = () => {
          if (installingWorker.state === "installed") {
            if (navigator.serviceWorker.controller) {
              // 已經有舊 SW 在跑，新 SW 進入 waiting → 通知 UI
              notifyUpdateReady(registration);
              config.onUpdate?.(registration);
            } else {
              // 第一次安裝
              config.onSuccess?.(registration);
            }
          }
        };
      };

      // 啟動時主動檢一次
      registration.update().catch(() => {});

      // 每小時自動檢查一次
      if (updateCheckInterval) clearInterval(updateCheckInterval);
      updateCheckInterval = setInterval(
        () => registration.update().catch(() => {}),
        60 * 60 * 1000
      );

      // 視窗重新獲得焦點時也檢查
      window.addEventListener("focus", () => {
        registration.update().catch(() => {});
      });
    })
    .catch((error) => {
      console.error("[SW] Registration failed:", error);
    });
}

/** 套用 pending 的更新（SKIP_WAITING + controllerchange 會觸發 reload） */
export function applyUpdate() {
  const reg = pendingRegistration;
  if (!reg?.waiting) {
    // 沒有 pending 也直接 reload，至少能重新拉 HTML
    window.location.reload();
    return;
  }
  reg.waiting.postMessage({ type: "SKIP_WAITING" });
}

/**
 * 強制清除所有 cache + 註銷 SW + 重新載入。
 * 給使用者「卡舊版」時當 escape hatch 用。
 */
export async function forceClearAndReload() {
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) await reg.unregister();
  } catch {
    /* ignore */
  }
  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch {
    /* ignore */
  }
  window.location.reload();
}

export function unregister() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => registration.unregister())
      .catch((error) => console.error(error.message));
  }
}
