import { ChangeEvent, FC, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { shallowEqual } from "react-redux";
import { Ring } from "@uiball/loaders";

import useFilteredChannels from "@/hooks/useFilteredChannels";
import useFilteredUsers from "@/hooks/useFilteredUsers";
import useForwardMessage from "@/hooks/useForwardMessage";
import useRecentContacts from "@/hooks/useRecentContacts";
import useSendMessage from "@/hooks/useSendMessage";
import { useAppSelector } from "@/app/store";
import { ChatContext } from "@/types/common";
import IconClose from "@/assets/icons/close.svg";
import IconSearch from "@/assets/icons/search.svg";
import IconCheck from "@/assets/icons/check.sign.svg";
import Avatar from "../Avatar";
import ChannelIcon from "../ChannelIcon";

type Tab = "chat" | "user";
type Target = { type: ChatContext; id: number };

interface Props {
  mids: number[];
  initialPicked?: Target[];
  /** 點背景 / 拖把：返回上一層 ForwardSheet（保留外層 share mode） */
  closeModal: () => void;
  /** ✕ 整個流程取消：清掉外層 select state */
  onCancelAll: () => void;
  /** 送出成功：清狀態 + 關掉外層 sheet */
  onSent: () => void;
}

/**
 * 完整分享面板（從 ForwardSheet 「更多」進入）：
 * - 高度固定 90vh（即使對象少，仍給足夠空間放鍵盤）
 * - 上方標題列：✕、已選 (N)、分享
 * - 留言輸入框（鍵盤直接覆蓋下方列表是預期行為）
 * - 已選 chips（可個別 ✕ 移除）
 * - Tab：聊天 / 好友
 * - 搜尋框
 * - 「最近的傳送對象」+ 完整列表
 * - Checklist 多選（accent ✓）
 */
const ForwardFullSheet: FC<Props> = ({
  mids,
  initialPicked = [],
  closeModal,
  onCancelAll,
  onSent,
}) => {
  const { t } = useTranslation();
  const { sendMessages } = useSendMessage();
  const { forwardMessage, forwarding } = useForwardMessage();
  const recents = useRecentContacts(20);

  const { channels, updateInput: updateChannelInput } = useFilteredChannels();
  const { users, updateInput: updateUserInput, input } = useFilteredUsers();

  const [tab, setTab] = useState<Tab>("chat");
  const [picked, setPicked] = useState<Target[]>(initialPicked);
  const [appendText, setAppendText] = useState("");

  const [animated, setAnimated] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const isMobile = window.innerWidth < 768;

  const usersById = useAppSelector((s) => s.users.byId, shallowEqual);
  const channelsById = useAppSelector((s) => s.channels.byId, shallowEqual);

  useEffect(() => {
    if (isMobile) requestAnimationFrame(() => requestAnimationFrame(() => setAnimated(true)));
  }, []);

  const animateClose = (cb: () => void) => {
    if (isMobile) {
      const sheetH = sheetRef.current?.offsetHeight ?? window.innerHeight;
      setDragOffset(sheetH);
      setAnimated(false);
      setTimeout(() => { setDragOffset(0); cb(); }, 280);
    } else {
      cb();
    }
  };

  const isPicked = (type: ChatContext, id: number) =>
    picked.some((p) => p.type === type && p.id === id);

  const togglePick = (type: ChatContext, id: number) => {
    setPicked((prev) => {
      if (prev.some((p) => p.type === type && p.id === id)) {
        return prev.filter((p) => !(p.type === type && p.id === id));
      }
      return [...prev, { type, id }];
    });
  };

  const removePicked = (type: ChatContext, id: number) => {
    setPicked((prev) => prev.filter((p) => !(p.type === type && p.id === id)));
  };

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    updateChannelInput(v);
    updateUserInput(v);
  };

  const handleSend = async () => {
    if (picked.length === 0 || forwarding) return;
    const userIds = picked.filter((p) => p.type === "dm").map((p) => p.id);
    const channelIds = picked.filter((p) => p.type === "channel").map((p) => p.id);
    await forwardMessage({
      mids: mids.map((m) => +m),
      users: userIds,
      channels: channelIds,
    });
    if (appendText.trim()) {
      await sendMessages({
        content: appendText,
        users: userIds,
        channels: channelIds,
      });
    }
    toast.success(t("tip.forward_success", { ns: "common" }));
    animateClose(onSent);
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
    if (dragOffset > 80) animateClose(closeModal);
    else setDragOffset(0);
  };

  const onCancel = () => animateClose(onCancelAll);

  // 渲染 picked chips
  const pickedChips = picked.length > 0 && (
    <div className="flex gap-3 px-3 pt-2 pb-3 overflow-x-auto no-scrollbar">
      {picked.map((p) => {
        const u = p.type === "dm" ? usersById[p.id] : null;
        const ch = p.type === "channel" ? channelsById[p.id] : null;
        const name = p.type === "dm" ? u?.name ?? "" : ch?.name ?? "";
        return (
          <button
            key={`${p.type}_${p.id}`}
            type="button"
            onClick={() => removePicked(p.type, p.id)}
            className="relative shrink-0 flex flex-col items-center gap-1"
          >
            <span className="relative w-[44px] h-[44px] rounded-full overflow-visible">
              <span className="w-full h-full rounded-full overflow-hidden flex-center bg-bg-surface">
                {p.type === "dm" ? (
                  <Avatar width={44} height={44} src={u?.avatar} name={u?.name} className="w-full h-full" />
                ) : (
                  <ChannelIcon personal={!ch?.is_public} className="[&>svg]:w-5 [&>svg]:h-5 fill-fg-secondary" />
                )}
              </span>
              <span className="absolute -top-1 -right-1 w-4 h-4 flex-center bg-bg-surface rounded-full border border-border">
                <IconClose className="w-2.5 h-2.5 fill-fg-secondary" />
              </span>
            </span>
            <span className="ts-mini text-fg-secondary truncate max-w-[60px]">{name}</span>
          </button>
        );
      })}
    </div>
  );

  // tab 切換
  const TabBar = (
    <div className="flex border-b border-border-subtle shrink-0">
      {(["chat", "user"] as Tab[]).map((tk) => (
        <button
          key={tk}
          type="button"
          onClick={() => setTab(tk)}
          className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
            tab === tk ? "text-fg-primary" : "text-fg-secondary"
          }`}
        >
          {tk === "chat" ? t("chat", { ns: "common" }) : t("members", { ns: "common" })}
          {tab === tk && (
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-[2px] bg-accent rounded-full" />
          )}
        </button>
      ))}
    </div>
  );

  const SearchBox = (
    <div className="px-3 py-2 shrink-0">
      <div className="relative">
        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 fill-fg-disabled" />
        <input
          className="w-full bg-bg-surface rounded-md pl-9 pr-3 py-2 text-sm text-fg-body placeholder:text-fg-disabled outline-none border border-border focus:border-border-strong transition-colors"
          value={input}
          onChange={handleSearch}
          placeholder={t("placeholder.search_user_or_channel", { ns: "common" })}
        />
      </div>
    </div>
  );

  // 對象列表（依 tab 切）
  const renderRow = (type: ChatContext, id: number, name: string, avatar?: string, isPublic?: boolean) => {
    const checked = isPicked(type, id);
    return (
      <li
        key={`${type}_${id}`}
        onClick={() => togglePick(type, id)}
        className="cursor-pointer flex items-center gap-3 px-4 py-2 hover:bg-bg-hover active:bg-bg-hover transition-colors"
      >
        <span className="w-10 h-10 rounded-full overflow-hidden flex-center bg-bg-surface shrink-0">
          {type === "dm" ? (
            <Avatar width={40} height={40} src={avatar} name={name} className="w-full h-full" />
          ) : (
            <ChannelIcon personal={!isPublic} className="[&>svg]:w-5 [&>svg]:h-5 fill-fg-secondary" />
          )}
        </span>
        <span className="flex-1 ts-sm text-fg-body truncate">{name}</span>
        <span
          className={`w-6 h-6 rounded-full flex-center shrink-0 transition-colors ${
            checked ? "bg-accent" : "border-2 border-border-strong"
          }`}
        >
          {checked && <IconCheck className="w-3.5 h-3.5 fill-accent-on" />}
        </span>
      </li>
    );
  };

  const recentSection = !input && recents.length > 0 && (
    <div>
      <div className="px-4 pt-3 pb-1 text-xs text-fg-secondary font-semibold">
        {t("recent_targets", { ns: "chat", defaultValue: "最近的傳送對象" })}
      </div>
      <ul>
        {recents
          .filter((c) => (tab === "chat" ? c.type === "channel" || c.type === "dm" : c.type === "dm"))
          .map((c) => {
            if (c.type === "dm") {
              const u = usersById[c.id];
              return renderRow("dm", c.id, u?.name ?? "", u?.avatar);
            }
            const ch = channelsById[c.id];
            return renderRow("channel", c.id, ch?.name ?? "", undefined, ch?.is_public);
          })}
      </ul>
    </div>
  );

  const fullList = tab === "chat" ? (
    <div>
      {channels && channels.length > 0 && (
        <>
          <div className="px-4 pt-3 pb-1 text-xs text-fg-secondary font-semibold">
            {t("chat", { ns: "common" })}
          </div>
          <ul>
            {channels.map((c) =>
              renderRow("channel", c.gid, c.name ?? "", undefined, c.is_public)
            )}
          </ul>
        </>
      )}
    </div>
  ) : (
    <div>
      {users && users.length > 0 && (
        <ul>
          {users.map((u) => renderRow("dm", u.uid, u.name ?? "", u.avatar))}
        </ul>
      )}
    </div>
  );

  // ── Header ──
  const Header = (
    <div className="relative flex items-center justify-between px-4 py-3 border-b border-border-subtle shrink-0">
      <button
        type="button"
        onClick={onCancel}
        className="p-1 -ml-1 text-fg-subtle hover:text-fg-secondary transition-colors"
        aria-label={t("action.cancel", { ns: "common" })}
      >
        <IconClose className="w-5 h-5 fill-current" />
      </button>
      <span className="absolute inset-x-0 text-center font-semibold text-sm text-fg-primary pointer-events-none">
        {t("selected_count", { ns: "chat", count: picked.length, defaultValue: `已選 (${picked.length})` })}
      </span>
      <button
        type="button"
        onClick={handleSend}
        disabled={picked.length === 0 || forwarding}
        className="ts-sm font-semibold text-accent disabled:text-fg-disabled disabled:cursor-not-allowed"
      >
        {t("action.share", { ns: "common" })}
      </button>
    </div>
  );

  const LoaderOverlay = forwarding && (
    <div className="absolute inset-0 z-[10] flex-center flex-col gap-3 bg-bg-elevated/90">
      <Ring size={36} lineWeight={4} speed={2} color="rgb(var(--c-accent))" />
      <span className="ts-meta text-fg-secondary">{t("tip.sending", { ns: "common" })}</span>
    </div>
  );

  // ── Body ──
  const Body = (
    <>
      {/* 留言輸入框（最上方） */}
      <div className="px-3 pt-2 pb-1 shrink-0">
        <input
          className="w-full px-3 py-2 ts-meta text-fg-body bg-bg-surface border border-border focus:border-border-strong outline-none rounded-md transition-colors placeholder:text-fg-disabled"
          value={appendText}
          onChange={(e) => setAppendText(e.target.value)}
          placeholder={t("placeholder.leave_message", { ns: "common" })}
        />
      </div>
      {pickedChips}
      {TabBar}
      {SearchBox}
      <div className="flex-1 overflow-y-auto pb-3">
        {recentSection}
        {fullList}
      </div>
    </>
  );

  if (isMobile) {
    return createPortal(
      <div className="fixed inset-0 z-[210]">
        <div
          className="absolute inset-0 bg-bg-app/50 transition-opacity duration-300"
          style={{ opacity: animated ? 1 : 0 }}
          onClick={() => animateClose(closeModal)}
        />
        <div
          ref={sheetRef}
          className="absolute left-0 right-0 bg-bg-elevated flex flex-col overflow-hidden"
          style={{
            borderRadius: "10px 10px 0 0",
            // 不跟 keyboardOffset：鍵盤直接覆蓋下半部，sheet 90vh 高度不變、上方標題列 + 留言框保持可見
            bottom: 0,
            height: "90vh",
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
          {Body}
          <div style={{ paddingBottom: "env(safe-area-inset-bottom)" }} />
          {LoaderOverlay}
        </div>
      </div>,
      document.body
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-[210] flex items-center justify-center bg-bg-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
      <div className="relative flex flex-col w-[480px] max-w-[90vw] h-[80vh] bg-bg-elevated border border-border rounded-xl shadow-overlay overflow-hidden">
        {Header}
        {Body}
        {LoaderOverlay}
      </div>
    </div>,
    document.body
  );
};

export default ForwardFullSheet;
