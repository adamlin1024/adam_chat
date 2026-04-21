import { useCallback, useRef } from "react";

export default function useLongPress(callback: () => void, delay = 500) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const movedRef = useRef(false);

  const start = useCallback(() => {
    movedRef.current = false;
    timerRef.current = setTimeout(() => {
      if (!movedRef.current) callback();
    }, delay);
  }, [callback, delay]);

  const cancel = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const move = useCallback(() => {
    movedRef.current = true;
    cancel();
  }, [cancel]);

  return {
    onTouchStart: start,
    onTouchEnd: cancel,
    onTouchMove: move,
  };
}
