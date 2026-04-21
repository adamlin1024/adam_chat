import { ChangeEvent, FC, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";
import { useOutsideClick } from "rooks";

import useFilteredUsers from "@/hooks/useFilteredUsers";
import useKeyboardOffset from "@/hooks/useKeyboardOffset";
import Modal from "./Modal";
import User from "./User";

interface Props {
  closeModal: () => void;
}

const UsersModal: FC<Props> = ({ closeModal }) => {
  const { t } = useTranslation("chat");
  const { t: tMember } = useTranslation("member");
  const { users, updateInput, input } = useFilteredUsers();
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
    if (dragOffset > 80) animateClose();
    else setDragOffset(0);
  };

  if (isMobile) {
    return createPortal(
      <div className="fixed inset-0 z-[200]">
        <div
          className="absolute inset-0 bg-black/50 transition-opacity duration-300"
          style={{ opacity: animated ? 1 : 0 }}
          onClick={animateClose}
        />
        <div
          ref={sheetRef}
          className="absolute left-0 right-0 bg-bg-elevated flex flex-col overflow-hidden"
          style={{
            borderRadius: "10px 10px 0 0",
            bottom: `${keyboardOffset}px`,
            maxHeight: "80vh",
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
              <span className="absolute inset-x-0 text-center font-semibold text-sm text-fg-primary pointer-events-none">
                {tMember("send_msg", { defaultValue: "搜尋成員" })}
              </span>
              <button onClick={animateClose} className="p-1 rounded text-fg-subtle hover:text-fg-secondary transition-colors">✕</button>
            </div>
          </div>
          <div className="px-3 py-2.5 border-b border-border-subtle shrink-0">
            <input
              autoFocus
              className="w-full bg-bg-surface rounded-md px-3 py-2 text-sm text-fg-body placeholder:text-fg-disabled outline-none border border-border focus:border-border-strong transition-colors"
              value={input}
              onChange={(e: ChangeEvent<HTMLInputElement>) => updateInput(e.target.value)}
              placeholder={t("search_user_placeholder")}
            />
          </div>
          {users && (
            <ul className="flex flex-col overflow-y-auto flex-1 py-2">
              {users.map((u) => {
                const { uid = 0 } = u || {};
                return (
                  <li key={uid} className="cursor-pointer px-3 active:bg-bg-surface">
                    <NavLink className="w-full" onClick={animateClose} to={`/chat/dm/${uid}`}>
                      <User uid={uid} interactive={false} />
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          )}
          <div style={{ paddingBottom: "env(safe-area-inset-bottom)" }} />
        </div>
      </div>,
      document.body
    );
  }

  return (
    <Modal>
      <div
        ref={wrapperRef}
        className="flex flex-col w-80 md:w-[440px] max-h-[402px] bg-bg-elevated border border-border rounded-xl shadow-overlay"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle shrink-0">
          <span className="font-semibold text-sm text-fg-primary">
            {tMember("send_msg", { defaultValue: "搜尋成員" })}
          </span>
          <button onClick={closeModal} className="p-1 rounded text-fg-subtle hover:text-fg-secondary transition-colors">✕</button>
        </div>
        <div className="px-3 py-2 border-b border-border-subtle shrink-0">
          <input
            autoFocus
            className="w-full bg-bg-surface rounded-md px-3 py-2 text-sm text-fg-body placeholder:text-fg-disabled outline-none border border-border focus:border-border-strong transition-colors"
            value={input}
            onChange={(e: ChangeEvent<HTMLInputElement>) => updateInput(e.target.value)}
            placeholder={t("search_user_placeholder")}
          />
        </div>
        {users && (
          <ul className="flex flex-col overflow-y-scroll flex-1 py-2">
            {users.map((u) => {
              const { uid = 0 } = u || {};
              return (
                <li key={uid} className="cursor-pointer px-2 hover:bg-bg-surface">
                  <NavLink className="w-full" onClick={closeModal} to={`/chat/dm/${uid}`}>
                    <User uid={uid} interactive={false} />
                  </NavLink>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Modal>
  );
};

export default UsersModal;
