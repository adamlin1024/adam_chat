import { useRef } from "react";

type Opts = {
  delay?: number;          // 觸發毫秒，預設 500
  moveThreshold?: number;  // 取消的位移閾值（px），預設 10
  haptic?: boolean;        // 觸發時震動，預設 true
};

/**
 * 長按 hook：回傳要綁在元素上的 touch event handlers。
 * 短按不觸發；移動超過閾值取消；觸發後可選震動。
 */
export default function useLongPress(callback: () => void, opts: Opts = {}) {
  const { delay = 500, moveThreshold = 10, haptic = true } = opts;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);

  const cancel = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    start.current = { x: t.clientX, y: t.clientY };
    timer.current = setTimeout(() => {
      if (haptic && typeof navigator !== "undefined" && "vibrate" in navigator) {
        try { navigator.vibrate?.(40); } catch { /* ignore */ }
      }
      callback();
    }, delay);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!start.current) return;
    const t = e.touches[0];
    const dx = t.clientX - start.current.x;
    const dy = t.clientY - start.current.y;
    if (Math.hypot(dx, dy) > moveThreshold) cancel();
  };

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd: cancel,
    onTouchCancel: cancel,
  };
}
