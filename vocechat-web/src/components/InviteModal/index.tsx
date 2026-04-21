import { FC, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { useOutsideClick } from "rooks";

import { useAppSelector } from "@/app/store";
import useKeyboardOffset from "@/hooks/useKeyboardOffset";
import Modal from "../Modal";
import AddMembers from "./AddMembers";
import InviteByEmail from "./InviteByEmail";
import { shallowEqual } from "react-redux";

interface Props {
  type?: "server" | "channel";
  cid?: number;
  title?: string;
  closeModal: () => void;
}

const InviteModal: FC<Props> = ({ type = "server", cid, title = "", closeModal }) => {
  const { t } = useTranslation("chat");
  const channel = useAppSelector((store) => (cid ? store.channels.byId[cid] : undefined), shallowEqual);
  const serverName = useAppSelector((store) => store.server.name, shallowEqual);
  const finalTitle = type == "server" ? serverName : `#${title || channel?.name}`;
  const [animated, setAnimated] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const keyboardOffset = useKeyboardOffset();
  const isMobile = window.innerWidth < 768;
  useOutsideClick(wrapperRef, () => { if (!isMobile) closeModal(); });

  useEffect(() => {
    if (isMobile) requestAnimationFrame(() => requestAnimationFrame(() => setAnimated(true)));
  }, []);

  const animateClose = () => {
    if (isMobile) {
      const sheetH = sheetRef.current?.offsetHeight ?? window.innerHeight;
      setDragOffset(sheetH);
      setAnimated(false);
      setTimeout(() => { setDragOffset(0); closeModal(); }, 280);
    } else {
      closeModal();
    }
  };
  const handleDragStart = (e: React.TouchEvent) => { dragStartY.current = e.touches[0].clientY; setIsDragging(true); };
  const handleDragMove = (e: React.TouchEvent) => { const delta = e.touches[0].clientY - dragStartY.current; if (delta > 0) setDragOffset(delta); };
  const handleDragEnd = () => { setIsDragging(false); if (dragOffset > 80) animateClose(); else setDragOffset(0); };

  const header = (onClose: () => void) => (
    <div className="relative flex items-center justify-between px-4 py-2.5 border-b border-border-subtle shrink-0">
      <div className="w-7" />
      <span className="absolute inset-x-0 text-center font-semibold text-sm text-fg-primary pointer-events-none">
        {t("invite_title", { name: finalTitle })}
      </span>
      <button onClick={onClose} className="p-1 rounded text-fg-subtle hover:text-fg-secondary transition-colors shrink-0">✕</button>
    </div>
  );

  if (isMobile) {
    return createPortal(
      <div className="fixed inset-0 z-[200]">
        <div className="absolute inset-0 bg-black/50 transition-opacity duration-300" style={{ opacity: animated ? 1 : 0 }} onClick={animateClose} />
        <div
          ref={sheetRef}
          className="absolute left-0 right-0 bg-bg-elevated flex flex-col overflow-hidden"
          style={{
            borderRadius: "10px 10px 0 0",
            bottom: `${keyboardOffset}px`,
            maxHeight: "85vh",
            transform: dragOffset > 0 ? `translateY(${dragOffset}px)` : (animated ? "translateY(0)" : "translateY(100%)"),
            transition: isDragging ? "none" : "transform 320ms cubic-bezier(0.32,0.72,0,1)",
          }}
        >
          <div className="flex flex-col shrink-0 touch-none select-none" onTouchStart={handleDragStart} onTouchMove={handleDragMove} onTouchEnd={handleDragEnd}>
            <div className="flex justify-center pt-2.5 pb-1"><div className="w-9 h-1 rounded-full bg-fg-disabled" /></div>
            {header(animateClose)}
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-4">
            {!channel?.is_public && <AddMembers cid={cid} closeModal={animateClose} />}
            <InviteByEmail cid={channel?.is_public ? undefined : cid} />
          </div>
          <div style={{ paddingBottom: "env(safe-area-inset-bottom)" }} />
        </div>
      </div>,
      document.body
    );
  }

  return (
    <Modal>
      <div ref={wrapperRef} className="flex flex-col bg-bg-elevated border border-border rounded-xl max-h-[85vh] md:min-w-[408px] shadow-overlay">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle shrink-0 sticky top-0 bg-bg-elevated z-10">
          <span className="font-semibold text-sm text-fg-primary">{t("invite_title", { name: finalTitle })}</span>
          <button onClick={closeModal} className="p-1 rounded text-fg-subtle hover:text-fg-secondary transition-colors shrink-0">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-4">
          {!channel?.is_public && <AddMembers cid={cid} closeModal={closeModal} />}
          <InviteByEmail cid={channel?.is_public ? undefined : cid} />
        </div>
      </div>
    </Modal>
  );
};

export default InviteModal;
