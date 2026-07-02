/**
 * 【暫時性偵測工具】iOS 鍵盤失焦排查用，抓到主因後整個移除。
 *
 * 只有管理員（或手動開 localStorage KB_DEBUG=1 / 網址帶 #kbdebug）看得到；
 * 一般使用者完全不受影響。畫面最上方顯示一條記錄條，即時記下與「輸入框失焦」
 * 相關的所有事件順序：focusin / focusout / visualViewport resize/scroll /
 * 任何元素的 scroll / selectionchange，並附上當下 document.activeElement。
 *
 * 用法：點一次輸入框讓 bug 重現 → 看最後十幾行的順序 → 截圖回報。
 */
import { useEffect, useRef, useState } from "react";
import { useAppSelector } from "@/app/store";
import { shallowEqual } from "react-redux";

const MAX_LINES = 50;

function desc(el: any): string {
  if (!el) return "null";
  if (el.nodeType === 9) return "document";
  if (el === document.body) return "body";
  if (el === document.documentElement) return "html";
  const tag = (el.tagName || "?").toString().toLowerCase();
  const id = el.id ? `#${el.id}` : "";
  let cls = "";
  if (typeof el.className === "string" && el.className) {
    cls = "." + el.className.split(/\s+/).filter(Boolean).slice(0, 2).join(".");
  }
  const ce = el.isContentEditable ? "[CE]" : "";
  return `${tag}${id}${cls}${ce}`;
}

export default function KbFocusDebug() {
  const isAdmin = useAppSelector((s) => s.authData.user?.is_admin ?? false, shallowEqual);
  const enabled =
    isAdmin ||
    (typeof localStorage !== "undefined" && localStorage.getItem("KB_DEBUG") === "1") ||
    (typeof location !== "undefined" && location.hash.indexOf("kbdebug") !== -1);

  const [lines, setLines] = useState<string[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const t0 = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    if (location.hash.indexOf("kbdebug") !== -1) localStorage.setItem("KB_DEBUG", "1");
    t0.current = performance.now();

    // 游標(選取)狀態：rc = range 數（0 = 沒有游標/選取＝caret 不見了）；
    // ^ = collapsed（單純游標）、~ = 有選字；@ = 游標落在哪個元素
    const selStr = () => {
      try {
        const s = window.getSelection();
        if (!s) return "sel:none";
        const an: any = s.anchorNode;
        const anEl = an && an.nodeType === 3 ? an.parentElement : an;
        return `sel:rc${s.rangeCount}${s.rangeCount ? (s.isCollapsed ? "^" : "~") : ""}@${desc(anEl)}`;
      } catch {
        return "sel:err";
      }
    };

    const push = (msg: string) => {
      const t = Math.round(performance.now() - t0.current);
      setLines((prev) => {
        const next = prev.concat(
          `+${t} ${msg} | act=${desc(document.activeElement)} | ${selStr()}`
        );
        return next.slice(-MAX_LINES);
      });
    };

    const vv = window.visualViewport;
    const onFocusIn = (e: any) => push(`FOCUSIN ${desc(e.target)}`);
    const onFocusOut = (e: any) => push(`FOCUSOUT ${desc(e.target)} next=${desc(e.relatedTarget)}`);
    const onVVResize = () =>
      push(`VVresize h=${Math.round(vv!.height)} offTop=${Math.round(vv!.offsetTop)}`);
    const onVVScroll = () => push(`VVscroll offTop=${Math.round(vv!.offsetTop)}`);
    const onScroll = (e: any) => {
      const tgt = e.target;
      const el = tgt && tgt.nodeType === 9 ? document.scrollingElement || document.documentElement : tgt;
      const st = el && typeof el.scrollTop === "number" ? Math.round(el.scrollTop) : "?";
      push(`SCROLL ${desc(el)} top=${st}`);
    };
    let selTimer: any = 0;
    const onSelChange = () => {
      // selectionchange 會連發，節流成 120ms 一筆，避免洗版
      if (selTimer) return;
      selTimer = setTimeout(() => {
        selTimer = 0;
      }, 120);
      push(`SELchange`);
    };
    // 打字有沒有真的進到輸入框：beforeinput/input 有觸發＝按鍵有到；沒觸發＝完全沒收到
    const onBeforeInput = (e: any) => push(`BEFOREINPUT "${(e.data ?? "").toString().slice(0, 6)}"`);
    const onInput = (e: any) => push(`INPUT "${(e.data ?? "").toString().slice(0, 6)}"`);
    const onKeyDown = (e: any) => push(`KEYDOWN ${e.key}`);

    document.addEventListener("focusin", onFocusIn, true);
    document.addEventListener("focusout", onFocusOut, true);
    document.addEventListener("scroll", onScroll, true);
    document.addEventListener("selectionchange", onSelChange, true);
    document.addEventListener("beforeinput", onBeforeInput, true);
    document.addEventListener("input", onInput, true);
    document.addEventListener("keydown", onKeyDown, true);
    if (vv) {
      vv.addEventListener("resize", onVVResize);
      vv.addEventListener("scroll", onVVScroll);
    }
    push(`=== 偵測就緒 h=${vv ? Math.round(vv.height) : "?"}，請點輸入框 ===`);

    return () => {
      document.removeEventListener("focusin", onFocusIn, true);
      document.removeEventListener("focusout", onFocusOut, true);
      document.removeEventListener("scroll", onScroll, true);
      document.removeEventListener("selectionchange", onSelChange, true);
      document.removeEventListener("beforeinput", onBeforeInput, true);
      document.removeEventListener("input", onInput, true);
      document.removeEventListener("keydown", onKeyDown, true);
      if (vv) {
        vv.removeEventListener("resize", onVVResize);
        vv.removeEventListener("scroll", onVVScroll);
      }
      if (selTimer) clearTimeout(selTimer);
    };
  }, [enabled]);

  if (!enabled) return null;

  const barBtn: React.CSSProperties = {
    background: "transparent",
    border: "1px solid currentColor",
    borderRadius: 4,
    padding: "0 6px",
    cursor: "pointer",
  };

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        style={{
          position: "fixed",
          top: 4,
          right: 4,
          zIndex: 2147483647,
          background: "rgba(0,0,0,0.85)",
          color: "#0f0",
          border: "none",
          borderRadius: 6,
          font: "12px monospace",
          padding: "3px 7px",
        }}
      >
        🐛
      </button>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 2147483647,
        maxHeight: "42vh",
        overflowY: "auto",
        background: "rgba(0,0,0,0.85)",
        color: "#00ff6a",
        font: "10px/1.35 ui-monospace, Menlo, monospace",
        padding: "4px 6px",
        whiteSpace: "pre-wrap",
        wordBreak: "break-all",
      }}
    >
      <div style={{ display: "flex", gap: 8, marginBottom: 3, color: "#0ff" }}>
        <span>KB-FOCUS 偵測</span>
        <button style={{ ...barBtn, color: "#ff0" }} onClick={() => setLines([])}>
          clear
        </button>
        <button style={{ ...barBtn, color: "#f90" }} onClick={() => setCollapsed(true)}>
          hide
        </button>
      </div>
      {lines.map((l, i) => (
        <div key={i}>{l}</div>
      ))}
    </div>
  );
}
