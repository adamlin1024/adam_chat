import React, { FC, useEffect, useRef, useState } from "react";
import Tippy from "@tippyjs/react";
import clsx from "clsx";
import dayjs from "dayjs";
import IconAdmin from "@/assets/icons/owner.svg";
import { useAppSelector } from "@/app/store";
import { ChatContext } from "@/types/common";
import useContextMenu from "@/hooks/useContextMenu";
import usePinMessage from "@/hooks/usePinMessage";
import IconInfo from "@/assets/icons/info.svg";
import Avatar from "../Avatar";
import Profile from "../Profile";
import Tooltip from "../Tooltip";
import Commands from "./Commands";
import ContextMenu from "./ContextMenu";
import EditMessage from "./EditMessage";
import ExpireTimer from "./ExpireTimer";
import Reaction from "./Reaction";
import renderContent from "./renderContent";
import Reply from "./Reply";
import useInView from "./useInView";
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
  const { visible: contextMenuVisible, handleContextMenuEvent, hideContextMenu } = useContextMenu();
  const inViewRef = useInView<HTMLDivElement>();
  const [edit, setEdit] = useState(false);
  const avatarRef = useRef(null);
  const selectedTextRef = useRef<string>("");
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
    setEdit((prev) => !prev);
  };

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
        // 在右键点击时保存选中的文本（手机端禁用该功能，因为长按必定会选中）
        if (!isMobile()) {
          const selection = window.getSelection();
          selectedTextRef.current = selection?.toString().trim() || "";
        }
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
        editMessage={toggleEditMessage}
        context={context}
        contextId={contextId}
        mid={mid}
        visible={contextMenuVisible && !failed}
        hide={hideContextMenu}
        selectedText={selectedTextRef.current}
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
            <div
              className={clsx(
                "vc-msg select-text ts-msg text-fg-body wb whitespace-pre-wrap min-w-0",
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
