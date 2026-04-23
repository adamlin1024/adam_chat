import { ChangeEvent, FC, MouseEvent, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import i18n from "@/i18n";
import clsx from "clsx";
import { useOutsideClick } from "rooks";

import { useCreateChannelMutation, useSendChannelMsgMutation } from "@/app/services/channel";
import { useAppSelector } from "@/app/store";
import { CreateChannelDTO } from "@/types/channel";
import useFilteredUsers from "@/hooks/useFilteredUsers";
import useKeyboardOffset from "@/hooks/useKeyboardOffset";
import ChannelIcon from "../ChannelIcon";
import Modal from "../Modal";
import StyledCheckbox from "../styled/Checkbox";
import StyledToggle from "../styled/Toggle";
import User from "../User";
import { shallowEqual } from "react-redux";

interface Props {
  personal?: boolean;
  closeModal: () => void;
}

const ChannelModal: FC<Props> = ({ personal = false, closeModal }) => {
  const { t } = useTranslation("chat");
  const navigateTo = useNavigate();
  const [sendMessage] = useSendChannelMsgMutation();
  const channelData = useAppSelector((store) => store.channels.byId, shallowEqual);
  const loginUser = useAppSelector((store) => store.authData.user, shallowEqual);
  const [data, setData] = useState<CreateChannelDTO>({
    name: "",
    description: "",
    members: loginUser?.uid ? [loginUser.uid] : [],
    is_public: !personal,
  });
  const { users, input, updateInput } = useFilteredUsers();
  const [createChannel, { isSuccess, isError, isLoading, data: newChannel }] = useCreateChannelMutation();
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

  const handleToggle = () => setData((prev) => ({ ...prev, is_public: !prev.is_public }));
  const handleCreate = () => {
    if (!data.name) { toast("please input channel name"); return; }
    const payload = { ...data };
    if (payload.is_public) delete payload.members;
    createChannel(payload);
  };

  useEffect(() => { if (isError) toast.error("create new channel failed"); }, [isError]);
  useEffect(() => {
    const id = typeof newChannel == "object" ? newChannel.gid : newChannel;
    if (isSuccess && id && channelData[id]) {
      const name = channelData[id].name;
      const welcome = i18n.t("welcome_msg", { ns: "chat", name }) ?? "";
      sendMessage({ id, content: welcome, from_uid: loginUser?.uid, type: "text" });
      closeModal();
      toast.success("create new channel success");
      navigateTo(`/chat/channel/${id}`);
    }
  }, [isSuccess, newChannel, channelData]);

  const handleNameInput = (evt: ChangeEvent<HTMLInputElement>) => setData((prev) => ({ ...prev, name: evt.target.value }));
  const handleInputChange = (evt: ChangeEvent<HTMLInputElement>) => updateInput(evt.target.value);
  const toggleCheckMember = ({ currentTarget }: MouseEvent<HTMLLIElement>) => {
    const members = data.members ?? [];
    const { uid } = currentTarget.dataset;
    const uidNum = Number(uid);
    const tmp = members.includes(uidNum) ? members.filter((m) => m != uidNum) : [...members, uidNum];
    setData((prev) => ({ ...prev, members: tmp }));
  };

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

  if (!loginUser) return null;
  const { name, members, is_public } = data;
  const loginUid = loginUser.uid;

  const memberPicker = (
    <div className={clsx("flex flex-col", isMobile ? "border-b border-border-subtle max-h-[200px]" : "md:w-[240px] border-r border-border-subtle")}>
      <div className="sticky top-0 bg-bg-elevated border-b border-border-subtle px-3 py-2 shrink-0">
        <input
          className="w-full bg-bg-surface rounded-md px-3 py-1.5 text-sm border border-border focus:border-border-strong outline-none text-fg-body placeholder:text-fg-disabled transition-colors"
          value={input}
          onChange={handleInputChange}
          placeholder={t("search_user_placeholder")}
        />
      </div>
      {users && (
        <ul className="flex flex-col overflow-y-scroll no-scrollbar overflow-x-hidden flex-1">
          {users.map((u) => {
            const { uid } = u;
            const checked = members ? members.includes(uid) : false;
            return (
              <li
                key={uid}
                data-uid={uid}
                className="cursor-pointer flex items-center px-3 rounded hover:bg-[#0f1014] transition-colors"
                onClick={loginUid == uid ? undefined : toggleCheckMember}
              >
                <StyledCheckbox disabled={loginUid == uid} readOnly checked={checked} name="cb" id="cb" />
                <User uid={uid} interactive={false} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );

  const nameInput = (
    <div className="w-full flex flex-col gap-1.5">
      <span className="font-mono ts-2xs uppercase tracking-widest text-fg-disabled">{t("channel_name")}</span>
      <div className="relative">
        <input
          className="font-mono text-xs text-fg-body rounded-md px-3 py-2 pl-8 border border-border focus:border-border-strong w-full bg-bg-surface outline-none transition-colors placeholder:text-fg-disabled"
          onChange={handleNameInput}
          value={name}
          placeholder="new-channel"
        />
        <ChannelIcon personal={!is_public} className="absolute left-2.5 top-1/2 -translate-y-1/2 opacity-50" />
      </div>
    </div>
  );

  const privateToggle = (
    <div className="w-full flex items-center justify-between">
      <span className="font-mono ts-xs text-fg-secondary">{t("private_channel")}</span>
      <StyledToggle checked={!is_public} disabled={!loginUser?.is_admin} onClick={handleToggle} />
    </div>
  );

  const actionButtons = (onClose: () => void) => (
    <div className="w-full flex gap-3 items-center justify-end">
      <button onClick={onClose} className="px-4 py-2 rounded-md font-mono ts-meta font-bold text-fg-secondary border border-border hover:border-border-strong transition-colors">
        {t("action.cancel", { ns: "common" })}
      </button>
      <button disabled={isLoading} onClick={handleCreate} className="px-4 py-2 rounded-md font-mono ts-meta font-bold bg-accent text-accent-on hover:opacity-90 transition-opacity disabled:opacity-40">
        {t("action.create", { ns: "common" })}
      </button>
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
            maxHeight: "90vh",
            transform: dragOffset > 0 ? `translateY(${dragOffset}px)` : (animated ? "translateY(0)" : "translateY(100%)"),
            transition: isDragging ? "none" : "transform 320ms cubic-bezier(0.32,0.72,0,1)",
          }}
        >
          {/* Drag handle + title header */}
          <div className="flex flex-col shrink-0 touch-none select-none" onTouchStart={handleDragStart} onTouchMove={handleDragMove} onTouchEnd={handleDragEnd}>
            <div className="flex justify-center pt-2.5 pb-1"><div className="w-9 h-1 rounded-full bg-fg-disabled" /></div>
            <div className="relative flex items-center justify-between px-4 py-2.5 border-b border-border-subtle">
              <div className="w-7" />
              <span className="absolute inset-x-0 text-center font-semibold text-sm text-fg-primary pointer-events-none">{t("create_channel")}</span>
              <button onClick={animateClose} className="p-1 rounded text-fg-subtle hover:text-fg-secondary transition-colors">✕</button>
            </div>
          </div>
          {/* Content: desc → name → toggle → member picker → buttons */}
          <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">
            <p className="font-mono text-xs text-fg-subtle">
              {!is_public ? t("create_private_channel_desc") : t("create_channel_desc")}
            </p>
            {nameInput}
            {privateToggle}
            {!is_public && (
              <div className="flex flex-col gap-2">
                <span className="font-mono ts-2xs uppercase tracking-widest text-fg-disabled">{t("search_user_placeholder")}</span>
                <input
                  className="w-full bg-bg-surface rounded-md px-3 py-2 text-sm border border-border focus:border-border-strong outline-none text-fg-body placeholder:text-fg-disabled transition-colors"
                  value={input}
                  onChange={handleInputChange}
                  placeholder={t("search_user_placeholder")}
                />
                {users && (
                  <ul className="flex flex-col max-h-[180px] overflow-y-auto no-scrollbar">
                    {users.map((u) => {
                      const { uid } = u;
                      const checked = members ? members.includes(uid) : false;
                      return (
                        <li key={uid} data-uid={uid}
                          className="cursor-pointer flex items-center px-2 rounded hover:bg-[#0f1014] transition-colors"
                          onClick={loginUid == uid ? undefined : toggleCheckMember}
                        >
                          <StyledCheckbox disabled={loginUid == uid} readOnly checked={checked} name="cb" id="cb" />
                          <User uid={uid} interactive={false} />
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
            {actionButtons(animateClose)}
          </div>
          <div style={{ paddingBottom: "env(safe-area-inset-bottom)" }} />
        </div>
      </div>,
      document.body
    );
  }

  return (
    <Modal>
      <div ref={wrapperRef} className="flex flex-col md:flex-row max-h-[440px] bg-bg-elevated border border-border rounded-xl shadow-overlay overflow-hidden">
        {!is_public && memberPicker}
        {/* Desktop form panel with title */}
        <div className="flex flex-col items-start p-7 gap-5 relative w-full md:min-w-[380px]">
          <button onClick={closeModal} className="absolute top-4 right-4 p-1 rounded text-fg-subtle hover:text-fg-secondary transition-colors">✕</button>
          <div>
            <h3 className="font-bold text-base tracking-tight text-fg-primary mb-1">{t("create_channel")}</h3>
            <p className="font-mono text-xs text-fg-subtle">{!is_public ? t("create_private_channel_desc") : t("create_channel_desc")}</p>
          </div>
          {nameInput}
          {privateToggle}
          {actionButtons(closeModal)}
        </div>
      </div>
    </Modal>
  );
};

export default ChannelModal;
