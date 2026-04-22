import { useEffect, useRef, useState } from "react";
import { shallowEqual } from "react-redux";
import { useAppSelector } from "@/app/store";

const StreamStatus = () => {
  const status = useAppSelector((store) => store.ui.SSEStatus, shallowEqual);
  const [visible, setVisible] = useState(false);
  const [opacity, setOpacity] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    clearTimeout(timerRef.current);
    if (status === "reconnecting") {
      setVisible(true);
      requestAnimationFrame(() => setOpacity(1));
    } else if (status === "connected" && visible) {
      setOpacity(0);
      timerRef.current = setTimeout(() => setVisible(false), 380);
    }
  }, [status]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-bg-app flex items-center justify-center"
      style={{ opacity, transition: "opacity 350ms ease" }}
    >
      <div className="flex items-center gap-2.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 rounded-full bg-accent"
            style={{ animation: "sDot 1.2s ease-in-out infinite", animationDelay: `${i * 160}ms` }}
          />
        ))}
      </div>
    </div>
  );
};

export default StreamStatus;
