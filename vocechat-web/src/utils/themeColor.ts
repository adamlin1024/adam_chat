/**
 * 同步瀏覽器 / PWA 上方 status bar 顏色（meta name="theme-color"）。
 *
 * 顏色值對應 assets/index.css 中的 --c-bg-app：
 * - dark:  rgb(8 9 11)   = #08090b
 * - light: rgb(242 239 233) = #f2efe9
 *
 * 動到 CSS bg-app 時記得這裡也要同步改。
 */
export const THEME_BAR_COLORS = {
  dark: "#08090b",
  light: "#f2efe9"
} as const;

export function applyThemeColor(isDark: boolean) {
  const color = isDark ? THEME_BAR_COLORS.dark : THEME_BAR_COLORS.light;
  // 移除舊的 media-scoped meta（index.html fallback 用），只留一個 JS 控制的
  document
    .querySelectorAll('meta[name="theme-color"]')
    .forEach((el) => el.parentElement?.removeChild(el));
  const meta = document.createElement("meta");
  meta.name = "theme-color";
  meta.content = color;
  document.head.appendChild(meta);
}

export function isCurrentlyDark(): boolean {
  return document.documentElement.classList.contains("dark");
}
