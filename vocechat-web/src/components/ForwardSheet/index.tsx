import { FC, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { shallowEqual } from "react-redux";
import { Ring } from "@uiball/loaders";

import useForwardMessage from "@/hooks/useForwardMessage";
import useKeyboardOffset from "@/hooks/useKeyboardOffset";
import useRecentContacts, { RecentContact } from "@/hooks/useRecentContacts";
import { useAppSelector } from "@/app/store";
import { updateSelectMessages } from "@/app/slices/ui";
import { ChatContext } from "@/types/common";
import IconClose from "@/assets/icons/close.svg";
import IconSearch from "@/assets/icons/search.svg";
import IconMore from "@/assets/icons/more.svg";
import IconCheck from "@/assets/icons/check.sign.svg";
import Avatar from "../Avatar";
import ChannelIcon from "../ChannelIcon";
import ForwardFullSheet from "../ForwardFullSheet";

export type ForwardTarget = { type: ChatContext; id: number };

interface Props {
  mids: number[];
  context?: ChatContext;
  contextId?: number;
  closeModal: () => void;
}

/**
 * LINE 風格分享 bottom-sheet（快速分享層）：
 * - 4×2 grid：前 7 格最近聯絡人，第 8 格「更多」
 * - 多選模式：點頭像 toggle 選取（綠色 ✓ overlay）
 * - 底部「分享 (N)」按鈕送出
 * - 「更多」/🔍 → 開 ForwardFullSheet（90vh、搜尋、tab、留言）
 */
const ForwardSheet: FC<Props> = ({ mids, context, contextId, closeModal }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { forwardMessage, forwarding } = useForwardMessage();
  const recents = useRecentContacts(7);

  const [showFull, setShowFull] = useState(false);
  const [animated, setAnimated] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [picked, setPicked] = useState<ForwardTarget[]>([]);

  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const keyboardOffset = useKeyboardOffset();
  const isMobile = window.innerWidth < 768;

  const usersById = useAppSelector((s) => s.users.byId, shallowEqual);
  const channelsById = useAppSelector((s) => s.channels.byId, shallowEqual);

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

  const finishForward = () => {
    if (context && contextId) {
      dispatch(updateSelectMessages({ context, id: contextId, operation: "reset" }));
    }
    animateClose();
  };

  const isPicked = (c: RecentContact) =>
    picked.some((p) => p.type === c.type && p.id === c.id);

  const togglePick = (c: RecentContact) => {
    setPicked((prev) => {
      const exists = prev.some((p) => p.type === c.type && p.id === c.id);
      if (exists) return prev.filter((p) => !(p.type === c.type && p.id === c.id));
      return [...prev, { type: c.type, id: c.id }];
    });
  };

  const handleSend = async () => {
    if (picked.length === 0 || forwarding) return;
    const users = picked.filter((p) => p.type === "dm").map((p) => p.id);
    const channels = picked.filter((p) => p.type === "channel").map((p) => p.id);
    await forwardMessage({ mids: mids.map((m) => +m), users, channels });
    toast.success(t("tip.forward_success", { ns: "common" }));
    finishForward();
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

  // 「更多」→ 完整 sheet（90vh、tab、搜尋、留言、多選）
  if (showFull) {
    return (
      <ForwardFullSheet
        mids={mids}
        initialPicked={picked}
        closeModal={() => {
          setShowFull(false);
        }}
        onCancelAll={() => {
          // 完整 sheet 內按✕：整個分享流程結束（含外層 ForwardSheet）
          if (context && contextId) {
            dispatch(updateSelectMessages({ context, id: contextId, operation: "reset" }));
          }
          closeModal();
        }}
        onSent={() => {
          if (context && contextId) {
            dispatch(updateSelectMessages({ context, id: contextId, operation: "reset" }));
          }
          closeModal();
        }}
      />
    );
  }

  const renderCheck = () => (
    <span className="absolute -top-1 -right-1 w-5 h-5 flex-center bg-accent rounded-full border-2 border-bg-elevated">
      <IconCheck className="w-3 h-3 fill-accent-on" />
    </span>
  );

  const moreCell = (
    <button
      key="__more"
      type="button"
      onClick={() => setShowFull(true)}
      className="flex flex-col items-center gap-1.5 active:opacity-70 transition-opacity"
      title={t("more", { ns: "common" })}
    >
      <span className="w-[60px] h-[60px] rounded-full bg-bg-surface border border-border flex-center">
        <IconMore className="w-6 h-6 fill-fg-secondary" />
      </span>
      <span className="ts-mini text-fg-secondary truncate max-w-[72px]">
        {t("more", { ns: "common" })}
      </span>
    </button>
  );

  const renderContact = (c: RecentContact) => {
    const isDm = c.type === "dm";
    const u = isDm ? usersById[c.id] : null;
    const ch = !isDm ? channelsById[c.id] : null;
    const name = isDm ? u?.name ?? "" : ch?.name ?? "";
    const checked = isPicked(c);
    return (
      <button
        key={`${c.type}_${c.id}`}
        type="button"
        onClick={() => togglePick(c)}
        className="flex flex-col items-center gap-1.5 active:opacity-70 transition-opacity min-w-0"
      >
        <span className="relative w-[60px] h-[60px] rounded-full overflow-visible flex-center bg-bg-surface">
          <span className="w-full h-full rounded-full overflow-hidden flex-center">
            {isDm ? (
              <Avatar width={60} height={60} src={u?.avatar} name={u?.name} className="w-full h-full" />
            ) : (
              <span className="w-full h-full flex-center bg-bg-surface text-fg-secondary">
                <ChannelIcon
                  personal={!ch?.is_public}
                  className="[&>svg]:w-6 [&>svg]:h-6 fill-fg-secondary"
                />
              </span>
            )}
          </span>
          {checked && renderCheck()}
        </span>
        <span className={`ts-mini truncate max-w-[72px] ${checked ? "text-accent font-semibold" : "text-fg-secondary"}`}>
          {name}
        </span>
      </button>
    );
  };

  const visibleRecents = recents.slice(0, 7);
  const cells: React.ReactNode[] = visibleRecents.map(renderContact);
  cells.push(moreCell);

  const Header = (
    <div className="relative flex items-center justify-between px-4 py-3 border-b border-border-subtle shrink-0">
      <button
        type="button"
        onClick={animateClose}
        className="p-1 -ml-1 text-fg-subtle hover:text-fg-secondary transition-colors"
        aria-label={t("action.cancel", { ns: "common" })}
      >
        <IconClose className="w-5 h-5 fill-current" />
      </button>
      <span className="absolute inset-x-0 text-center font-semibold text-sm text-fg-primary pointer-events-none">
        {t("forward_to", { ns: "chat" })}
      </span>
      <button
        type="button"
        onClick={() => setShowFull(true)}
        className="p-1 -mr-1 text-fg-subtle hover:text-fg-secondary transition-colors"
        aria-label={t("action.search", { ns: "common" })}
      >
        <IconSearch className="w-5 h-5 fill-current" />
      </button>
    </div>
  );

  const Grid = (
    <div className="grid grid-cols-4 gap-x-2 gap-y-4 px-4 py-5">
      {cells}
    </div>
  );

  const SendButton = (
    <div className="px-4 pt-1 pb-3 border-t border-border-subtle">
      <button
        type="button"
        onClick={handleSend}
        disabled={picked.length === 0 || forwarding}
        className="w-full py-2.5 rounded-lg bg-accent text-accent-on font-semibold disabled:opacity-40 hover:bg-accent-hover active:bg-accent-pressed transition-colors"
      >
        {t("action.share", { ns: "common" })}
        {picked.length > 0 && `（${picked.length}）`}
      </button>
    </div>
  );

  // 全螢幕 loader（送出期間阻止互動 + 蓋住氣泡 / 列表的 reflow 抖動）
  const LoaderOverlay = forwarding && (
    <div className="absolute inset-0 z-[10] flex-center flex-col gap-3 bg-bg-elevated/90">
      <Ring size={36} lineWeight={4} speed={2} color="rgb(var(--c-accent))" />
      <span className="ts-meta text-fg-secondary">{t("tip.sending", { ns: "common" })}</span>
    </div>
  );

  if (isMobile) {
    return createPortal(
      <div className="fixed inset-0 z-[2000]">
        <div
          className="absolute inset-0 bg-bg-app/50 transition-opacity duration-300"
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
            {Header}
          </div>
          {Grid}
          {SendButton}
          <div style={{ paddingBottom: "env(safe-area-inset-bottom)" }} />
          {LoaderOverlay}
        </div>
      </div>,
      document.body
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-bg-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
      <div className="relative flex flex-col w-[440px] max-w-[90vw] bg-bg-elevated border border-border rounded-xl shadow-overlay overflow-hidden">
        {Header}
        {Grid}
        {SendButton}
        {LoaderOverlay}
      </div>
    </div>,
    document.body
  );
};

export default ForwardSheet;
