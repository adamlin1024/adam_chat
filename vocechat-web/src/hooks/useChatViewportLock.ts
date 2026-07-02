import { useEffect } from "react";

/**
 * iOS 聊天鍵盤修正（有偵測資料佐證，2026-07）。
 *
 * 實測 log（點輸入框後）：
 *   FOCUSIN 輸入框 → VVresize h=465 → SCROLL html top=414（iOS 把整頁往上捲來露出
 *   輸入框）→ 訊息列表 scrollToBottom → SCROLL html top=0（整頁又被拉回 0）
 *   → 輸入框落到鍵盤後面、看不到游標＝「點了不能打字」。焦點其實沒掉（activeElement
 *   全程都是輸入框），是輸入框被藏到鍵盤後面。長對話才有東西可捲、才會被拉回 0。
 *
 * 修法（從根因切入）：
 *  1. 把「可見區高度」(visualViewport.height) 寫進 --app-height，讓聊天外殼跟著
 *     鍵盤縮，輸入框永遠停在鍵盤正上方、始終在可見區內。
 *  2. 掛載期間對 <html> 加 kb-lock class；配合 CSS 把整份文件鎖成 position:fixed
 *     的 app 外殼 —— iOS 對「聚焦時捲動露出輸入框」會無視 overflow:hidden，只有
 *     position:fixed 擋得住，這是第一次嘗試沒成功的原因。
 *
 * 只在聊天頁掛載期間生效，離開自動解除。桌機 / Android 無害（算出的高度一致）。
 */
export default function useChatViewportLock() {
  useEffect(() => {
    const root = document.documentElement;
    const vv = window.visualViewport;

    let raf = 0;
    const apply = () => {
      raf = 0;
      const h = vv?.height ?? window.innerHeight;
      root.style.setProperty("--app-height", `${Math.round(h)}px`);
    };
    // 鍵盤動畫期間 resize/scroll 會連發，用 rAF 併批避免抖動
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };

    apply();
    root.classList.add("kb-lock");

    if (vv) {
      vv.addEventListener("resize", schedule);
      vv.addEventListener("scroll", schedule);
    }
    window.addEventListener("resize", schedule);
    window.addEventListener("orientationchange", schedule);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      if (vv) {
        vv.removeEventListener("resize", schedule);
        vv.removeEventListener("scroll", schedule);
      }
      window.removeEventListener("resize", schedule);
      window.removeEventListener("orientationchange", schedule);
      root.classList.remove("kb-lock");
      root.style.removeProperty("--app-height");
    };
  }, []);
}
