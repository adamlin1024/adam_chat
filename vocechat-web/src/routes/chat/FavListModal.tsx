import { FC, useEffect, useRef, useState } from "react";
import FavList from "./FavList";

type Props = {
  visible: boolean;
  onClose: () => void;
  cid?: number;
  uid?: number;
};

const FavListModal: FC<Props> = ({ visible, onClose, cid, uid }) => {
  const [animated, setAnimated] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const isMobile = window.innerWidth < 768;

  useEffect(() => {
    if (visible) {
      requestAnimationFrame(() => requestAnimationFrame(() => setAnimated(true)));
    } else {
      setAnimated(false);
      setDragOffset(0);
    }
  }, [visible]);

  if (!visible) return null;

  const animateClose = () => {
    if (isMobile) {
      const sheetH = sheetRef.current?.offsetHeight ?? window.innerHeight;
      setDragOffset(sheetH);
      setAnimated(false);
      setTimeout(() => {
        setDragOffset(0);
        onClose();
      }, 280);
    } else {
      onClose();
    }
  };

  const handleDragStart = (e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleDragMove = (e: React.TouchEvent) => {
    const delta = e.touches[0].clientY - dragStartY.current;
    if (delta > 0) setDragOffset(delta);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    if (dragOffset > 80) {
      animateClose();
    } else {
      setDragOffset(0);
    }
  };

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-[200]">
        <div
          className="absolute inset-0 bg-black/50 transition-opacity duration-300"
          style={{ opacity: animated ? 1 : 0 }}
          onClick={animateClose}
        />
        <div
          ref={sheetRef}
          className="absolute bottom-0 left-0 right-0 bg-bg-elevated flex flex-col overflow-hidden"
          style={{
            maxHeight: "82vh",
            borderRadius: "10px 10px 0 0",
            transform: dragOffset > 0
              ? `translateY(${dragOffset}px)`
              : (animated ? "translateY(0)" : "translateY(100%)"),
            transition: isDragging ? "none" : "transform 320ms cubic-bezier(0.32,0.72,0,1)",
          }}
        >
          <div
            className="flex flex-col shrink-0 touch-none select-none"
            onTouchStart={handleDragStart}
            onTouchMove={handleDragMove}
            onTouchEnd={handleDragEnd}
          >
            <div className="flex justify-center pt-2.5 pb-1">
              <div className="w-9 h-1 rounded-full bg-fg-disabled" />
            </div>
            <div className="relative flex items-center justify-between px-4 py-2.5 border-b border-border-subtle">
              <div className="w-7" />
              <span className="absolute inset-x-0 text-center font-semibold text-sm text-fg-primary pointer-events-none">已收藏訊息</span>
              <button onClick={animateClose} className="text-fg-subtle p-1 text-lg leading-none">✕</button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <FavList cid={cid} uid={uid} bare />
          </div>
          <div style={{ paddingBottom: "env(safe-area-inset-bottom)" }} />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-lg">
        <FavList cid={cid} uid={uid} />
      </div>
    </div>
  );
};

export default FavListModal;
