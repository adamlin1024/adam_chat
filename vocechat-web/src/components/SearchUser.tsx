import { ChangeEvent, FC, FormEvent, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import toast from "react-hot-toast";
import { useOutsideClick } from "rooks";

import BASE_URL from "@/app/config";
import { useSearchUserMutation, useUpdateContactStatusMutation } from "@/app/services/user";
import { useAppSelector } from "@/app/store";
import IconSearch from "@/assets/icons/search.svg";
import useKeyboardOffset from "@/hooks/useKeyboardOffset";
import Avatar from "./Avatar";
import Modal from "./Modal";
import StyledButton from "./styled/Button";
import { shallowEqual } from "react-redux";

type Props = { closeModal: () => void };
type Type = "id" | "email" | "name";

const SearchUser: FC<Props> = ({ closeModal }) => {
  const [updateContactStatus, { isLoading: adding, error: addContactError }] =
    useUpdateContactStatusMutation();
  const usersData = useAppSelector((store) => store.users.byId, shallowEqual);
  const isAdmin = useAppSelector((store) => store.authData.user?.is_admin, shallowEqual);
  const addFriendEnable = useAppSelector((store) => store.server.add_friend_enable ?? true, shallowEqual);
  const { t } = useTranslation();
  const { t: tMember } = useTranslation("member");
  const navigateTo = useNavigate();
  const inputRef = useRef(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [type, setType] = useState<Type>("name");
  const [input, setInput] = useState({ id: "", email: "", name: "" });
  const [searchUser, { data, isSuccess, isLoading, isError, reset, error: searchError }] =
    useSearchUserMutation();
  const [animated, setAnimated] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const keyboardOffset = useKeyboardOffset();
  const isMobile = window.innerWidth < 768;
  useOutsideClick(wrapperRef, () => { if (!isMobile) closeModal(); });

  useEffect(() => {
    if (isMobile) requestAnimationFrame(() => requestAnimationFrame(() => setAnimated(true)));
  }, []);

  const isSearchDisabled =
    !!searchError &&
    "data" in searchError &&
    typeof searchError.data === "string" &&
    (searchError.data as string).includes("disabled by the administrator") &&
    (("originalStatus" in searchError && searchError.originalStatus === 403) ||
      ("status" in searchError && searchError.status === 403));

  useEffect(() => { if (isSearchDisabled) toast.error(t("search_disabled", { ns: "member" })); }, [isSearchDisabled]);
  useEffect(() => {
    if (!addContactError) return;
    const err = addContactError as any;
    const httpStatus: number = err?.originalStatus ?? err?.status;
    const errData: string = typeof err?.data === "string" ? err.data : "";
    toast.error(
      httpStatus === 403 && errData.includes("disabled by the administrator")
        ? t("add_friend_disabled", { ns: "member" })
        : t("tip.update_failed", { ns: "common", defaultValue: "Operation failed" })
    );
  }, [addContactError]);

  const handleInput = (evt: ChangeEvent<HTMLInputElement>) => setInput((prev) => ({ ...prev, [type]: evt.target.value }));
  const resetInput = () => { reset(); setInput((prev) => ({ ...prev, [type]: "" })); };
  const handleSubmit = (evt: FormEvent<HTMLFormElement>) => {
    evt.preventDefault();
    if (!inputRef.current) return;
    const form = inputRef.current as HTMLFormElement;
    if (!form.checkValidity()) { form.reportValidity(); return; }
    searchUser({ search_type: type, keyword: input[type] });
  };
  const handleChat = async (directChat: boolean) => {
    if (!data) return;
    if (!directChat) {
      const result = await updateContactStatus({ target_uid: data.uid, action: "add" });
      if ("error" in result) return;
    }
    animateClose();
    navigateTo(`/chat/dm/${data.uid}`);
  };

  const inContact = Boolean(data && usersData[data.uid] && usersData[data.uid].status == "added");
  const inputType = type == "id" ? "number" : type == "email" ? "email" : "text";

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

  const typeRow = (
    <div className="flex items-center gap-2">
      {(["name", "email", "id"] as Type[]).map((t_) => (
        <StyledButton key={t_} className={clsx("mini", type !== t_ && "ghost !border-none !shadow-none")} onClick={() => setType(t_)}>
          {t_ === "name" ? tMember("search_by_name") : t_ === "email" ? tMember("search_by_email") : tMember("search_by_id")}
        </StyledButton>
      ))}
    </div>
  );

  const searchForm = (
    <form className="w-full relative" ref={inputRef} action="/" onSubmit={handleSubmit}>
      <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 fill-fg-disabled w-4 h-4 pointer-events-none" />
      <input
        required
        type={inputType}
        disabled={isLoading}
        value={input[type]}
        placeholder={`${type == "email" ? tMember("search_by_email_ph") : type == "id" ? tMember("search_by_id_ph") : tMember("search_by_name_ph")}...`}
        onChange={handleInput}
        className="w-full bg-bg-surface rounded-md pl-9 pr-3 py-2 text-sm border border-border focus:border-border-strong outline-none text-fg-body placeholder:text-fg-disabled transition-colors disabled:opacity-50"
      />
    </form>
  );

  const resultArea = (
    <div className="flex-1 flex items-center justify-center min-h-[160px] px-4 pb-4">
      {isError ? (
        <div className="flex flex-col gap-3 items-center">
          <span className="text-sm text-fg-subtle">{isSearchDisabled ? tMember("search_disabled") : t("tip.error", { ns: "common", defaultValue: "Something went wrong" })}</span>
          <StyledButton className="mini" onClick={resetInput}>Ok</StyledButton>
        </div>
      ) : isSuccess ? (
        data ? (
          <div className="flex flex-col items-center gap-2 py-4">
            <Avatar className="rounded-full" src={data.avatar_updated_at === 0 ? "" : `${BASE_URL}/resource/avatar?uid=${data.uid}&t=${data.avatar_updated_at}`} name={data.name} width={80} height={80} />
            <span className="text-fg-primary font-medium">{data.name}</span>
            <div className="flex gap-2">
              <StyledButton className="mini ghost" onClick={() => { navigateTo(`/chat/dm/${data.uid}`); animateClose(); }}>{tMember("send_msg")}</StyledButton>
              {!inContact && (isAdmin || addFriendEnable) && (
                <StyledButton disabled={adding} onClick={() => handleChat(inContact)} className={clsx("mini", inContact && "ghost")}>{tMember("add_to_contact")}</StyledButton>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 items-center">
            <span className="text-sm text-fg-subtle">{tMember("search_not_found")}</span>
            <StyledButton className="mini" onClick={resetInput}>Ok</StyledButton>
          </div>
        )
      ) : null}
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
          <div className="flex flex-col shrink-0 touch-none select-none" onTouchStart={handleDragStart} onTouchMove={handleDragMove} onTouchEnd={handleDragEnd}>
            <div className="flex justify-center pt-2.5 pb-1"><div className="w-9 h-1 rounded-full bg-fg-disabled" /></div>
            <div className="relative flex items-center justify-between px-4 py-2.5 border-b border-border-subtle">
              <div className="w-7" />
              <span className="absolute inset-x-0 text-center font-semibold text-sm text-fg-primary pointer-events-none">{tMember("search_user", { defaultValue: "搜尋用戶" })}</span>
              <button onClick={animateClose} className="p-1 rounded text-fg-subtle hover:text-fg-secondary transition-colors">✕</button>
            </div>
          </div>
          <div className="flex flex-col gap-3 px-4 py-3 shrink-0">
            {typeRow}
            {searchForm}
          </div>
          {resultArea}
          <div style={{ paddingBottom: "env(safe-area-inset-bottom)" }} />
        </div>
      </div>,
      document.body
    );
  }

  return (
    <Modal>
      <div ref={wrapperRef} className="flex flex-col w-96 bg-bg-elevated border border-border rounded-xl shadow-overlay">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle shrink-0">
          <span className="font-semibold text-sm text-fg-primary">{tMember("search_user", { defaultValue: "搜尋用戶" })}</span>
          <button onClick={closeModal} className="p-1 rounded text-fg-subtle hover:text-fg-secondary transition-colors">✕</button>
        </div>
        <div className="flex flex-col gap-3 px-4 py-3 shrink-0">
          {typeRow}
          {searchForm}
        </div>
        {resultArea}
      </div>
    </Modal>
  );
};

export default SearchUser;
