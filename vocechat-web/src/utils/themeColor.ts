/**
 * 同步瀏覽器 / Android PWA address bar 的 tint 顏色（meta name="theme-color"）。
 *
 * 設計原則：跟著 Design System 的 token 走，不再硬編碼一份對應表。
 * runtime 直接讀 `--c-bg-app` 的計算值，跟 `.dark` / `.light` 切換 100% 同步。
 *
 * 注意：**iOS PWA（standalone 模式）狀態列不靠這個機制**——iOS PWA 不會
 * 重讀 meta[theme-color]，所以另外用 `apple-mobile-web-app-status-bar-style=
 * black-translucent` + body padding-top: env(safe-area-inset-top) 透明覆蓋讓
 * 狀態列直接顯示 body 背景色（body 也走 --c-bg-app token），達到同樣的連動效果。
 */

function readBgAppColor(): string | null {
  const rgb = getComputedStyle(document.documentElement)
    .getPropertyValue("--c-bg-app")
    .trim();
  return rgb ? `rgb(${rgb})` : null;
}

export function applyThemeColor() {
  const color = readBgAppColor();
  if (!color) return;
  // 拿掉 index.html 的 media-scoped fallback metas，只留一個由 JS 控制的
  let meta = document.querySelector<HTMLMetaElement>(
    'meta[name="theme-color"]:not([media])'
  );
  if (!meta) {
    document
      .querySelectorAll('meta[name="theme-color"]')
      .forEach((el) => el.remove());
    meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.appendChild(meta);
  }
  meta.content = color;
}

/**
 * 啟動主題色同步：監聽 html.class 變動，主題切換時自動更新 meta[theme-color]。
 * 整個 app 只需在 bootstrap 呼叫一次；之後 DarkMode 切換、auto 模式跟系統等
 * 任何改動 html class 的地方都會被自動接住，不必每處手動呼叫。
 */
export function startThemeColorSync() {
  applyThemeColor();
  new MutationObserver(applyThemeColor).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
}

export function isCurrentlyDark(): boolean {
  return document.documentElement.classList.contains("dark");
}
