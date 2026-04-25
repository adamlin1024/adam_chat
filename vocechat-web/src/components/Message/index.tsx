import React, { FC, useEffect, useRef, useState } from "react";
import Tippy from "@tippyjs/react";
import { hideAll } from "tippy.js";
import clsx from "clsx";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import IconAdmin from "@/assets/icons/owner.svg";
import IconCopy from "@/assets/icons/copy.svg";
import IconReply from "@/assets/icons/reply.svg";
import IconForward from "@/assets/icons/forward.svg";
import IconSelect from "@/assets/icons/select.svg";
import IconEdit from "@/assets/icons/edit.svg";
import IconPin from "@/assets/icons/pin.svg";
import IconDelete from "@/assets/icons/delete.svg";
import IconBookmark from "@/assets/icons/bookmark.add.svg";
import IconBookmarked from "@/assets/icons/bookmark.svg";
import IconReact from "@/assets/icons/reaction.svg";
import { useAppSelector } from "@/app/store";
import { ChatContext } from "@/types/common";
import useContextMenu from "@/hooks/useContextMenu";
import useLongPress from "@/hooks/useLongPress";
import usePinMessage from "@/hooks/usePinMessage";
import useSendMessage from "@/hooks/useSendMessage";
import useFavMessage from "@/hooks/useFavMessage";
import { useReactMessageMutation } from "@/app/services/message";
import { updateSelectMessages } from "@/app/slices/ui";
import { addEditingMessage } from "@/app/slices/message";
import IconInfo from "@/assets/icons/info.svg";
import Avatar from "../Avatar";
import Profile from "../Profile";
import Tooltip from "../Tooltip";
import { Item as MenuItem } from "../ContextMenu";
import Commands from "./Commands";
import ContextMenu from "./ContextMenu";
import EditMessage from "./EditMessage";
import ExpireTimer from "./ExpireTimer";
import Reaction from "./Reaction";
import renderContent from "./renderContent";
import Reply from "./Reply";
import useInView from "./useInView";
import useMessageOperation from "./useMessageOperation";
import MessageActionPanel, { SheetItem } from "./MessageActionSheet";
import { shallowEqual } from "react-redux";
import NameWithRemark from "../NameWithRemark";
import { isMobile, resolveMsgTime } from "@/utils";
import { isStickerContent } from "@/utils/sticker";
import { useChatLayout } from "@/hooks/useChatLayout";

interface IProps {
  readOnly?: boolean;
  contextId: number;
  context?: ChatContext;
  read?: boolean;
  mid: number;
  updateReadIndex?: (param: any) => void;
}
const Message: FC<IProps> = ({
  readOnly = false,
  contextId,
  mid,
  context = "dm",
  updateReadIndex,
  read = true,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { visible: contextMenuVisible, handleContextMenuEvent, hideContextMenu } = useContextMenu();
  const inViewRef = useInView<HTMLDivElement>();
  const [edit, setEdit] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [nativeSelectMode, setNativeSelectMode] = useState(false);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef(null);
  const { getPinInfo } = usePinMessage(context == "channel" ? contextId : 0);
  const message = useAppSelector((store) => store.message[mid], shallowEqual);
  const { mode: chatLayout } = useChatLayout();
  const loginUid = useAppSelector((store) => store.authData.user?.uid, shallowEqual);
  // 只订阅当前消息发送者的用户信息，而不是整个usersData
  const currUser = useAppSelector((store) => store.users.byId[message?.from_uid || 0], shallowEqual);
  // 只订阅当前消息的reaction，而不是整个reactionMessageData
  const reactions = useAppSelector((store) => store.reactionMessage[mid], shallowEqual);
  // 获取pinInfo中需要的用户信息
  const pinInfo = getPinInfo(mid);
  const pinCreatorName = useAppSelector((store) => 
    pinInfo?.created_by ? store.users.byId[pinInfo.created_by]?.name : undefined, 
    shallowEqual
  );

  const toggleEditMessage = () => {
    // 手機：開啟下方輸入區的編輯模式（氣泡保持不動）
    // 桌機：氣泡內就地變成編輯框（既有行為）
    if (isMobile()) {
      dispatch(addEditingMessage({ key: `${context}_${contextId}`, mid }));
    } else {
      setEdit((prev) => !prev);
    }
  };

  // 訊息動作（給桌機右鍵 ContextMenu 與手機長按 ActionSheet 共用）
  const op = useMessageOperation({ mid, contextId, context, selectedText });
  const { setReplying } = useSendMessage({ context, to: contextId });
  const { addFavorite, isFavorited } = useFavMessage({
    cid: context == "channel" ? contextId : null,
  });
  const handleReply = () => { if (contextId) setReplying(mid); };
  const handleSelect = () => dispatch(updateSelectMessages({ context, id: contextId, data: mid }));
  // 「選取文字」：交還給瀏覽器原生選取行為
  const handleNativeSelect = () => {
    setNativeSelectMode(true);
    // 等下一個 tick，CSS 把 select-text 套上去之後再選文字
    setTimeout(() => {
      const el = bubbleRef.current;
      if (!el) return;
      const sel = window.getSelection();
      if (!sel) return;
      const range = document.createRange();
      range.selectNodeContents(el);
      sel.removeAllRanges();
      sel.addRange(range);
    }, 50);
  };
  const [reactMessage] = useReactMessageMutation();
  const handleReact = (emoji: string) => reactMessage({ mid, action: emoji });
  const handleAddFav = async () => {
    if (isFavorited(mid)) { toast.success(t("tip.fav_already")); return; }
    const ok = await addFavorite(mid);
    toast[ok ? "success" : "error"](ok ? t("tip.fav_added") : t("tip.fav_failed"));
  };

  const menuItems: MenuItem[] = [
    op.canEdit && { title: t("action.edit_msg"), icon: <IconEdit className="icon" />, handler: toggleEditMessage },
    op.canReply && { title: t("action.reply"), icon: <IconReply className="icon" />, handler: handleReply },
    op.canCopy && { title: t("action.copy"), icon: <IconCopy className="icon" />, handler: op.copyContent },
    op.canPin && {
      title: op.pinned ? t("action.unpin") : t("action.pin"),
      icon: <IconPin className="icon" />,
      handler: op.pinned ? () => op.unPin(mid) : op.togglePinModal,
    },
    { title: t("action.forward"), icon: <IconForward className="icon" />, handler: op.toggleForwardModal },
    { title: t("action.select"), icon: <IconSelect className="icon" />, handler: handleSelect },
    op.canDelete && {
      title: t("action.remove"),
      danger: true,
      icon: <IconDelete className="icon" />,
      handler: op.toggleDeleteModal,
    },
  ].filter((v) => typeof v !== "boolean" && "title" in (v ?? {})) as MenuItem[];

  // 手機 sheet 用 grid 排，icon 比較大、加收藏與反應
  const sheetItems: SheetItem[] = [
    op.canCopy && { title: t("action.copy"), icon: <IconCopy className="w-6 h-6 fill-current" />, handler: op.copyContent },
    op.canCopy && { title: t("action.select_text", { ns: "common", defaultValue: "選取文字" }), icon: <IconSelect className="w-6 h-6 fill-current" />, handler: handleNativeSelect },
    op.canReply && { title: t("action.reply"), icon: <IconReply className="w-6 h-6 fill-current" />, handler: handleReply },
    { title: t("action.add_to_fav"), icon: <IconBookmark className="w-6 h-6 fill-current" />, handler: handleAddFav },
    { title: t("action.add_reaction"), icon: <IconReact className="w-6 h-6 fill-current" />, handler: () => {}, isReact: true },
    { title: t("action.forward"), icon: <IconForward className="w-6 h-6 fill-current" />, handler: op.toggleForwardModal },
    { title: t("action.select"), icon: <IconSelect className="w-6 h-6 fill-current" />, handler: handleSelect },
    op.canEdit && { title: t("action.edit_msg"), icon: <IconEdit className="w-6 h-6 fill-current" />, handler: toggleEditMessage },
    op.canPin && {
      title: op.pinned ? t("action.unpin") : t("action.pin"),
      icon: <IconPin className="w-6 h-6 fill-current" />,
      handler: op.pinned ? () => op.unPin(mid) : op.togglePinModal,
    },
    op.canDelete && {
      title: t("action.remove"),
      danger: true,
      icon: <IconDelete className="w-6 h-6 fill-current" />,
      handler: op.toggleDeleteModal,
    },
  ].filter((v) => typeof v !== "boolean" && "title" in (v ?? {})) as SheetItem[];

  const longPressHandlers = useLongPress(() => {
    if (readOnly || failed) return;
    hideAll();           // 關掉其他訊息已開的 panel，確保只有一個
    setSheetVisible(true);
  });

  useEffect(() => {
    if (!read) {
      // 标记已读
      const data =
        context == "dm"
          ? { users: [{ uid: +contextId, mid }] }
          : { groups: [{ gid: +contextId, mid }] };
      if (updateReadIndex) {
        updateReadIndex(data);
      }
    }
  }, [mid, read]);

  // 原生選取模式：點氣泡外面 → 關閉並清除選取
  useEffect(() => {
    if (!nativeSelectMode) return;
    const handler = (e: Event) => {
      const target = e.target as Node;
      if (bubbleRef.current?.contains(target)) return;
      setNativeSelectMode(false);
      window.getSelection()?.removeAllRanges();
    };
    // 延遲一個 tick 避免立刻被自己觸發
    const id = window.setTimeout(() => {
      document.addEventListener("mousedown", handler);
      document.addEventListener("touchstart", handler, { passive: true });
    }, 0);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [nativeSelectMode]);
  if (!message) return <div className="w-full h-[1px] invisible"></div>;
  const {
    reply_mid,
    from_uid: fromUid,
    created_at: rawTime,
    sending = false,
    content,
    thumbnail,
    download,
    content_type = "text/plain",
    edited,
    properties,
    expires_in = 0,
    failed = false,
  } = message;
  const time = resolveMsgTime(message) ?? rawTime;
  const dayjsTime = dayjs(time);
  const _key = properties?.local_id || mid;
  const showExpire = (expires_in ?? 0) > 0;
  const isSelf = fromUid == loginUid;
  const alignRight = chatLayout === "Right" || (chatLayout === "Alternating" && isSelf);
  // Alternating 模式下自己的訊息：隱藏頭像與名稱（LINE 風格）
  const hideIdentity = chatLayout === "Alternating" && isSelf;
  // 純貼圖訊息不使用氣泡（像 LINE 那樣直接浮在對話上）
  const isSticker = isStickerContent(content, content_type);
  // 純文字/markdown 才套泡泡樣式；檔案、圖片、語音、轉傳、貼圖保留原本卡片
  const useBubble = (content_type === "text/plain" || content_type === "text/markdown") && !isSticker;
  const timeText = dayjsTime.format("HH:mm");
  return (
    <div
      key={_key}
      onContextMenu={readOnly ? undefined : (evt) => {
        // 手機長按改用浮在氣泡上的 action panel；不開桌機右鍵選單（避免長按非氣泡區也跳）
        if (isMobile()) {
          evt.preventDefault();
          return;
        }
        const selection = window.getSelection();
        setSelectedText(selection?.toString().trim() || "");
        handleContextMenuEvent(evt);
      }}
      data-msg-mid={mid}
      data-created-at={time}
      ref={inViewRef}
      className={clsx(
        `group w-full relative flex items-start gap-2 md:gap-3 px-2 md:px-3 py-1 transition-colors duration-[120ms]`,
        !readOnly && "hover:bg-bg-hover",
        showExpire && "bg-danger/10",
        pinInfo && "bg-accent-bg !pt-7 border-l-2 border-accent",
        alignRight && "flex-row-reverse"
      )}
    >
      {!hideIdentity && (
        <Tippy
          key={_key}
          popperOptions={{ strategy: "fixed" }}
          disabled={readOnly}
          interactive
          placement="right"
          trigger="click"
          appendTo={() => document.body}
          content={<Profile uid={fromUid || 0} type="card" cid={context == "dm" ? 0 : contextId} />}
        >
          <div className="cursor-pointer w-9 h-9 shrink-0 mt-0.5" data-uid={fromUid} ref={avatarRef}>
            <Avatar
              className="w-9 h-9 rounded-full object-cover"
              width={36}
              height={36}
              src={currUser?.avatar}
              name={currUser?.name}
            />
          </div>
        </Tippy>
      )}
      <ContextMenu
        mid={mid}
        visible={contextMenuVisible && !failed}
        hide={hideContextMenu}
        items={menuItems}
      >
        <div
          className={clsx(
            "flex flex-col gap-1 min-w-0",
            hideIdentity ? "max-w-[85%] md:max-w-[75%]" : "w-full",
            pinInfo && "relative",
            alignRight && "items-end"
          )}
          data-pin-tip={`pinned by ${pinCreatorName || ""}`}
        >
          {pinInfo && (
            <span
              className={clsx(
                "absolute -top-1 -translate-y-full text-xs text-fg-secondary",
                alignRight ? "right-0" : "left-0"
              )}
            >
              {`pinned by ${pinCreatorName || ""}`}
            </span>
          )}
          {!hideIdentity && (
            <div
              className={clsx(`mb-0.5 flex items-baseline gap-2`, alignRight && "flex-row-reverse")}
            >
              <span className="ts-msg font-semibold tracking-tight text-fg-primary">
                {currUser?.name ? (
                  <NameWithRemark uid={currUser.uid} showName={false} name={currUser.name} />
                ) : (
                  "Deleted User"
                )}
              </span>
              {currUser?.is_admin && <IconAdmin className="w-3 h-3 fill-accent" />}
              {failed && (
                <span className="text-danger ts-2xs font-mono flex items-center gap-1">
                  <IconInfo className="stroke-danger w-3 h-3" /> Send Failed
                </span>
              )}
            </div>
          )}
          <div
            className={clsx(
              "flex items-end gap-1.5 max-w-full",
              alignRight && "flex-row-reverse"
            )}
          >
            <Tippy
              visible={sheetVisible}
              interactive
              placement="top"
              appendTo={() => document.body}
              popperOptions={{ strategy: "fixed" }}
              onClickOutside={() => setSheetVisible(false)}
              content={
                <MessageActionPanel
                  items={sheetItems}
                  hide={() => setSheetVisible(false)}
                  onReact={handleReact}
                />
              }
            >
            <div
              ref={bubbleRef}
              {...(nativeSelectMode ? {} : longPressHandlers)}
              className={clsx(
                // 手機 select-none 阻止 iOS 長按系統選字 menu；桌機 md:select-text 維持選字
                "vc-msg ts-msg text-fg-body wb whitespace-pre-wrap min-w-0",
                nativeSelectMode
                  ? "select-text [-webkit-user-select:text] [-webkit-touch-callout:default]"
                  : "select-none md:select-text [-webkit-touch-callout:none] md:[-webkit-touch-callout:default]",
                useBubble && [
                  "px-3 py-2 rounded-2xl break-words",
                  alignRight
                    ? "bg-accent/20 text-fg-primary rounded-tr-sm"
                    : "bg-bg-surface border border-border-subtle rounded-tl-sm",
                  hideIdentity ? "max-w-full" : "max-w-[85%] md:max-w-[70%]"
                ],
                !useBubble && "pr-6 md:pr-0",
                sending && "opacity-70"
              )}
            >
              {reply_mid && (
                <Reply key={reply_mid} mid={reply_mid} context={context} to={contextId} />
              )}
              {edit ? (
                <EditMessage mid={mid} cancelEdit={toggleEditMessage} />
              ) : (
                renderContent({
                  context,
                  to: contextId,
                  from_uid: fromUid,
                  created_at: time,
                  content_type,
                  properties,
                  content,
                  thumbnail,
                  download,
                  edited,
                })
              )}
            </div>
            </Tippy>
            <Tooltip
              delay={200}
              disabled={readOnly}
              placement="top"
              tip={dayjsTime.format("YYYY-MM-DD HH:mm:ss")}
            >
              <time className="font-mono ts-mini text-fg-disabled shrink-0 pb-0.5">
                {timeText}
              </time>
            </Tooltip>
            {isFavorited(mid) && (
              <IconBookmarked
                className="w-3 h-3 fill-accent shrink-0 mb-0.5"
                title={t("action.add_to_fav", { ns: "common" }) as string}
              />
            )}
            {hideIdentity && failed && (
              <span className="text-danger ts-2xs font-mono flex items-center gap-1 shrink-0">
                <IconInfo className="stroke-danger w-3 h-3" /> Send Failed
              </span>
            )}
          </div>
          {reactions && <Reaction mid={mid} reactions={reactions} readOnly={readOnly} />}
        </div>
      </ContextMenu>

      {showExpire && (
        <ExpireTimer
          enableRightLayout={alignRight}
          mid={message.mid}
          context={context}
          contextId={contextId}
          expiresIn={expires_in ?? 0}
          createAt={time ?? 0}
        />
      )}
      {!edit && !failed && !readOnly && (
        <Commands
          isSelf={alignRight}
          context={context}
          contextId={contextId}
          mid={mid}
          toggleEditMessage={toggleEditMessage}
        />
      )}
      {/* 由 useMessageOperation 提供的 modals（搬到此處統一渲染，不再放在 ContextMenu 內） */}
      {op.PinModal}
      {op.ForwardModal}
      {op.DeleteModal}
    </div>
  );
};
export default React.memo(Message, (prevs, nexts) => {
  // More precise memo comparison for better performance
  return (
    prevs.mid === nexts.mid &&
    prevs.readOnly === nexts.readOnly &&
    prevs.read === nexts.read &&
    prevs.contextId === nexts.contextId &&
    prevs.context === nexts.context
  );
});
