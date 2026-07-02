import { useEffect } from "react";

/**
 * iOS PWA 聊天鍵盤修正。
 *
 * 問題：iOS 不支援 meta viewport 的 interactive-widget，`100dvh` 也不會因為
 * 虛擬鍵盤而縮小。所以鍵盤一彈出，輸入框會被鍵盤蓋住，iOS 只好把整頁往上捲
 * 來露出游標（畫面「往上衝」）；捲動又和訊息列表的自動捲到底互相干擾，最後
 * 讓剛點下的輸入框失焦，等於點了一次卻不能打字。歷史越長（畫面已捲到底、有
 * 東西可捲）越明顯。
 *
 * 修法（從根因切入，不做單點表象修）：
 *  1. 把「目前可見區高度」(visualViewport.height) 寫進 CSS 變數 --app-height，
 *     讓聊天外殼高度跟著鍵盤縮 → 輸入框自然停在鍵盤正上方、始終在可見區內，
 *     iOS 就沒有「要捲整頁才露得出輸入框」的理由。
 *  2. 掛載期間鎖住 <html>（overflow:hidden + overscroll:none），
 *     連 iOS 在鍵盤動畫過渡那一幀想捲整頁都捲不動 → 不再往上衝、焦點不掉。
 *
 * 只在聊天頁掛載期間生效，離開聊天自動解除，不影響其他頁面。
 * 桌機 / Android 無害：桌機 visualViewport.height≈視窗高、Android 的
 * interactive-widget 本來就會縮版面，兩者算出的 --app-height 都會一致。
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
    // 用 rAF 併批多次連發的 resize/scroll（鍵盤動畫期間會連續觸發），避免抖動
    const schedule = () => {
      if (raf) return;
      raf = requestAnimationFrame(apply);
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
