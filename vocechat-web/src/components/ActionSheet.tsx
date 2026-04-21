import { FC, useEffect, useRef, useState } from "react";
import IconArrow from "@/assets/icons/arrow.right.svg";
import IconChecked from "@/assets/icons/check.sign.svg";
import IconBack from "@/assets/icons/arrow.left.svg";

export interface ActionSheetItem {
  title: string;
  handler?: () => void;
  danger?: boolean;
  checked?: boolean;
  subs?: ActionSheetItem[];
}

interface Props {
  visible: boolean;
  onClose: () => void;
  items: ActionSheetItem[];
  title?: string;
}

const ActionSheet: FC<Props> = ({ visible, onClose, items, title }) => {
  const [stack, setStack] = useState<{ title?: string; items: ActionSheetItem[] }[]>([]);
  const [animated, setAnimated] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const current = stack.length > 0 ? stack[stack.length - 1] : { title, items };

  useEffect(() => {
    if (visible) {
      requestAnimationFrame(() => requestAnimationFrame(() => setAnimated(true)));
    } else {
      setAnimated(false);
      setStack([]);
      setDragOffset(0);
    }
  }, [visible]);

  if (!visible) return null;

  const handleItem = (item: ActionSheetItem) => {
    if (item.checked) return;
    if (item.subs && item.subs.length > 0) {
      setStack((prev) => [...prev, { title: item.title, items: item.subs! }]);
      return;
    }
    item.handler?.();
    onClose();
  };

  const handleBack = () => {
    setStack((prev) => prev.slice(0, -1));
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
    const threshold = 80;
    if (dragOffset > threshold) {
      const sheetH = sheetRef.current?.offsetHeight ?? window.innerHeight;
      setDragOffset(sheetH);
      setAnimated(false);
      setTimeout(() => {
        setDragOffset(0);
        onClose();
      }, 280);
    } else {
      setDragOffset(0);
    }
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[200] flex items-end justify-center"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity duration-300"
        style={{ opacity: animated ? 1 : 0 }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="relative w-full bg-bg-elevated border-t border-border overflow-hidden"
        style={{
          borderRadius: "10px 10px 0 0",
          transform: dragOffset > 0
            ? `translateY(${dragOffset}px)`
            : (animated ? "translateY(0)" : "translateY(100%)"),
          transition: isDragging ? "none" : "transform 320ms cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
        {/* Header — drag area */}
        <div
          className="flex items-center px-4 py-3 border-b border-border-subtle touch-none select-none"
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
        >
          {stack.length > 0 ? (
            <button className="mr-2 p-1 -ml-1 rounded" onClick={handleBack}>
              <IconBack className="w-5 h-5 fill-fg-secondary" />
            </button>
          ) : null}
          {current.title ? (
            <span className="font-mono text-[11px] text-fg-subtle uppercase tracking-widest">
              {current.title}
            </span>
          ) : (
            <div className="mx-auto w-10 h-1 rounded-full bg-zinc-600" />
          )}
          {current.title && (
            <button
              className="ml-auto p-1 rounded text-fg-subtle hover:text-fg-secondary transition-colors"
              onClick={onClose}
            >
              ✕
            </button>
          )}
        </div>

        {/* Items */}
        <ul className="py-1">
          {current.items.map((item) => (
            <li
              key={item.title}
              onClick={() => handleItem(item)}
              className={`flex items-center justify-between px-4 py-3.5 cursor-pointer transition-colors active:bg-bg-surface text-[14px] ${
                item.danger ? "text-red-400" : "text-fg-body"
              }`}
            >
              <span>{item.title}</span>
              {item.checked && <IconChecked className="w-4 h-4 fill-accent" />}
              {item.subs && item.subs.length > 0 && (
                <IconArrow className="w-3.5 h-3.5 fill-fg-subtle" />
              )}
            </li>
          ))}
        </ul>

        <div style={{ paddingBottom: "env(safe-area-inset-bottom)" }} />
      </div>
    </div>
  );
};

export default ActionSheet;
