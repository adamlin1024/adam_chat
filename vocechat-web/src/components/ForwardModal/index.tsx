import { ChangeEvent, FC, MouseEvent, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useOutsideClick } from "rooks";

import useFilteredChannels from "@/hooks/useFilteredChannels";
import useFilteredUsers from "@/hooks/useFilteredUsers";
import useForwardMessage from "@/hooks/useForwardMessage";
import useKeyboardOffset from "@/hooks/useKeyboardOffset";
import useSendMessage from "@/hooks/useSendMessage";
import Channel from "../Channel";
import Modal from "../Modal";
import Button from "../styled/Button";
import StyledCheckbox from "../styled/Checkbox";
import Input from "../styled/Input";
import User from "../User";

interface IProps {
  mids: number[];
  closeModal: () => void;
}

/**
 * 沿用 UsersModal 的外殼模式：
 * - 手機：底部 bottom-sheet，slide-up 進場、可往下拖收合、點背景遮罩關閉
 * - 桌機：置中 modal，點面板外關閉
 * 只把內容換成多選 + 留言 + 送出。
 */
const ForwardModal: FC<IProps> = ({ mids, closeModal }) => {
  const { t } = useTranslation();
  const { sendMessages } = useSendMessage();
  const { forwardMessage, forwarding } = useForwardMessage();
  const { channels, updateInput: updateChannelInput } = useFilteredChannels();
  const { users, updateInput: updateUserInput, input } = useFilteredUsers();

  const [appendText, setAppendText] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<number[]>([]);
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

  const toggleCheck = ({ currentTarget }: MouseEvent<HTMLLIElement>) => {
    const { id = 0, type = "user" } = currentTarget.dataset;
    const ids = type == "user" ? selectedMembers : selectedChannels;
    const updateState = type == "user" ? setSelectedMembers : setSelectedChannels;
    const tmp = ids.includes(+id) ? ids.filter((m) => m != id) : [...ids, +id];
    updateState(tmp);
  };

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    updateChannelInput(v);
    updateUserInput(v);
  };

  const handleForward = async () => {
    await forwardMessage({
      mids: mids.map((mid) => +mid),
      users: selectedMembers,
      channels: selectedChannels,
    });
    if (appendText.trim()) {
      await sendMessages({
        content: appendText,
        users: selectedMembers,
        channels: selectedChannels,
      });
    }
    toast.success(t("tip.forward_success", { ns: "common" }));
    animateClose();
  };

  const selectedCount = selectedMembers.length + selectedChannels.length;
  const sendDisabled = selectedCount === 0 || forwarding;
  const title = (
    <>
      {t("forward_to", { ns: "chat" })}
      {selectedCount > 0 && (
        <span className="ml-1 text-fg-secondary font-normal">（{selectedCount}）</span>
      )}
    </>
  );

  // ── 共用內容（搜尋 + 列表 + 留言 + 送出） ──
  const SearchInput = (
    <input
      autoFocus
      className="w-full bg-bg-surface rounded-md px-3 py-2 text-sm text-fg-body placeholder:text-fg-disabled outline-none border border-border focus:border-border-strong transition-colors"
      value={input}
      onChange={handleSearchChange}
      placeholder={t("placeholder.search_user_or_channel", { ns: "common" })}
    />
  );

  const ListBody = (
    <ul className="flex flex-col overflow-y-auto flex-1 py-1">
      {channels?.map((c) => {
        const { gid } = c;
        const checked = selectedChannels.includes(gid);
        return (
          <li
            key={gid}
            data-type="channel"
            data-id={gid}
            onClick={toggleCheck}
            className="cursor-pointer flex items-center gap-2 px-3 py-2 hover:bg-bg-hover active:bg-bg-hover transition-colors"
          >
            <StyledCheckbox readOnly checked={checked} name="cb" id="cb" />
            <Channel id={gid} interactive={false} />
          </li>
        );
      })}
      {users?.map((u) => {
        const { uid = 0 } = u || {};
        const checked = selectedMembers.includes(uid);
        return (
          <li
            key={uid}
            data-id={uid}
            data-type="user"
            onClick={toggleCheck}
            className="cursor-pointer flex items-center gap-2 px-3 py-2 hover:bg-bg-hover active:bg-bg-hover transition-colors"
          >
            <StyledCheckbox readOnly checked={checked} name="cb" id="cb" />
            <User uid={uid} interactive={false} />
          </li>
        );
      })}
    </ul>
  );

  const Footer = (
    <div className="px-3 pt-2 pb-3 border-t border-border-subtle flex flex-col gap-2 shrink-0">
      <Input
        placeholder={t("placeholder.leave_message", { ns: "common" })}
        value={appendText}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setAppendText(e.target.value)}
      />
      <div className="flex items-center justify-end gap-3 pt-1">
        <Button onClick={animateClose} className="normal cancel">
          {t("action.cancel", { ns: "common" })}
        </Button>
        <Button className="normal" disabled={sendDisabled} onClick={handleForward}>
          {t("send_count", { ns: "chat", count: selectedCount })}
        </Button>
      </div>
    </div>
  );

  // ── 手機 bottom-sheet ──
  if (isMobile) {
    return createPortal(
      <div className="fixed inset-0 z-[200]">
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
          {/* Drag header */}
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
                {title}
              </span>
              <button
                onClick={animateClose}
                className="p-2 text-xl leading-none text-fg-subtle hover:text-fg-secondary transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
          <div className="px-3 py-2.5 border-b border-border-subtle shrink-0">
            {SearchInput}
          </div>
          {ListBody}
          {Footer}
          <div style={{ paddingBottom: "env(safe-area-inset-bottom)" }} />
        </div>
      </div>,
      document.body
    );
  }

  // ── 桌機 centered modal ──
  return (
    <Modal>
      <div
        ref={wrapperRef}
        className="flex flex-col w-80 md:w-[440px] max-h-[80vh] bg-bg-elevated border border-border rounded-xl shadow-overlay"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle shrink-0">
          <span className="font-semibold text-sm text-fg-primary">{title}</span>
          <button
            onClick={closeModal}
            className="p-2 text-xl leading-none text-fg-subtle hover:text-fg-secondary transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="px-3 py-2 border-b border-border-subtle shrink-0">
          {SearchInput}
        </div>
        {ListBody}
        {Footer}
      </div>
    </Modal>
  );
};

export default ForwardModal;
