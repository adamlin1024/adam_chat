/**
 * 同步瀏覽器 / PWA 上方 status bar 顏色（meta name="theme-color"）。
 * runtime 從 --c-bg-app token 讀，跟 .dark / .light 切換 100% 同步。
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
 * 整個 app 只需 bootstrap 呼叫一次。
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
