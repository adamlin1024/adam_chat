// @ts-nocheck
import { FC, useEffect, useState, memo, useRef, useCallback } from "react";
import { useDrop } from "react-dnd";
import { NativeTypes } from "react-dnd-html5-backend";
import { NavLink, useMatch, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import clsx from "clsx";
import { removeUserSession } from "@/app/slices/message.user";

import { useAppSelector } from "@/app/store";
import { ChatContext } from "@/types/common";
import Avatar from "@/components/Avatar";
import User from "@/components/User";
import useContextMenu from "@/hooks/useContextMenu";
import useUploadFile from "@/hooks/useUploadFile";
import { fromNowTime, resolveMsgTime } from "@/utils";
import IconLock from "@/assets/icons/lock.svg";
import IconMute from "@/assets/icons/mute.svg";
import IconVoicing from "@/assets/icons/voicing.svg";
import getUnreadCount, { renderPreviewMessage } from "../utils";
import ContextMenu from "./ContextMenu";
import { shallowEqual } from "react-redux";
import NameWithRemark from "../../../components/NameWithRemark";

interface IProps {
  type?: ChatContext;
  id: number;
  mid: number;
  pinned?: boolean;
  setDeleteChannelId: (param: number) => void;
  setDeleteDMId: (param: number) => void;
  setInviteChannelId: (param: number) => void;
}
const Session: FC<IProps> = ({
  type = "dm",
  pinned = false,
  id,
  mid,
  setDeleteChannelId,
  setDeleteDMId,
  setInviteChannelId,
}) => {
  const navPath = type == "dm" ? `/chat/dm/${id}` : `/chat/channel/${id}`;
  // const { pathname } = useLocation();
  const isCurrentPath = useMatch(navPath);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { addStageFile } = useUploadFile({ context: type, id });

  // 左滑手勢 + 長按呼出選單
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [swipeLocked, setSwipeLocked] = useState(false);
  const ACTION_W = 160;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    startYRef.current = e.touches[0].clientY;
    longPressTimer.current = setTimeout(() => {
      showContextMenu();
    }, 500);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const deltaX = e.touches[0].clientX - startXRef.current;
    const deltaY = e.touches[0].clientY - startYRef.current;
    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    }
    if (deltaX < 0) setSwipeOffset(Math.max(deltaX, -ACTION_W));
    else if (swipeLocked) setSwipeOffset(Math.min(0, -ACTION_W + deltaX));
  }, [swipeLocked, ACTION_W]);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (swipeOffset < -ACTION_W * 0.5) {
      setSwipeOffset(-ACTION_W);
      setSwipeLocked(true);
    } else {
      setSwipeOffset(0);
      setSwipeLocked(false);
    }
  }, [swipeOffset, ACTION_W]);

  const closeSwipe = useCallback(() => {
    setSwipeOffset(0);
    setSwipeLocked(false);
  }, []);

  const handleHide = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dispatch(removeUserSession(id));
    navigate("/chat");
  }, [dispatch, id, navigate]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (type === "channel") {
      setDeleteChannelId(id);
    } else {
      setDeleteDMId(id);
    }
    closeSwipe();
  }, [id, type, setDeleteChannelId, setDeleteDMId, closeSwipe]);

  const [{ isActive }, drop] = useDrop(
    () => ({
      accept: [NativeTypes.FILE],
      drop({ files }) {
        if (files.length) {
          const filesData = files.map((file) => {
            const { size, type, name } = file;
            const url = URL.createObjectURL(file);
            return { size, type, name, url };
          });
          addStageFile(filesData);
          navigate(type == "dm" ? `/chat/dm/${id}` : `/chat/channel/${id}`);
        }
      },
      collect: (monitor) => ({
        isActive: monitor.canDrop() && monitor.isOver(),
      }),
    }),
    [type, id]
  );
  const { visible: contextMenuVisible, handleContextMenuEvent, hideContextMenu, showContextMenu } = useContextMenu();
  const [data, setData] = useState<{
    name: string;
    icon: string;
    mid: number;
    is_public: boolean;
  }>();
  const loginUid = useAppSelector((store) => store.authData.user?.uid || 0, shallowEqual);
  const callingFrom = useAppSelector((store) => store.voice.callingFrom, shallowEqual);
  const callingTo = useAppSelector((store) => store.voice.callingTo, shallowEqual);
  const voiceList = useAppSelector((store) => store.voice.list, shallowEqual);
  const mids = useAppSelector(
    (store) => (type == "dm" ? store.userMessage.byId[id] : store.channelMessage[id]),
    shallowEqual
  );
  const muted = useAppSelector(
    (store) => (type == "dm" ? store.footprint.muteUsers[id] : store.footprint.muteChannels[id]),
    shallowEqual
  );
  const readIndex = useAppSelector(
    (store) => (type == "dm" ? store.footprint.readUsers[id] : store.footprint.readChannels[id]),
    shallowEqual
  );
  const messageData = useAppSelector((store) => store.message, shallowEqual);
  const userData = useAppSelector((store) => store.users.byId, shallowEqual);
  const channelData = useAppSelector((store) => store.channels.byId, shallowEqual);

  useEffect(() => {
    const tmp = type == "dm" ? userData[id] : channelData[id];
    if (!tmp) return;
    if (type == "dm") {
      // user
      const { name, avatar } = tmp;
      setData({ name, icon: avatar, mid, is_public: true });
    } else {
      // channel
      const { name, icon = "", is_public } = tmp;
      setData({ name, icon, mid, is_public });
    }
  }, [id, mid, type, userData, channelData]);
  if (!data) return null;
  const resolvedMid = mids?.length
    ? ([...mids].reverse().find((m: number) => messageData[m]) ?? mid)
    : mid;
  const previewMsg = messageData[resolvedMid] || messageData[mid] || {};
  const { name, icon, is_public } = data;
  const { unreads = 0, mentions = [] } = getUnreadCount({
    mids,
    readIndex,
    messageData,
    loginUid,
  });
  const hasMention = mentions.length > 0;
  const isVoicing =
    type == "channel"
      ? voiceList.some((item) => {
          return item.context == type && item.id === id;
        })
      : id == callingFrom || id == callingTo;
  console.log("unreads", unreads, isCurrentPath);

  return (
    <li className={clsx("session relative overflow-hidden")}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 左滑動作按鈕（手機專用） */}
      <div
        className="absolute right-0 top-0 h-full flex"
        style={{ width: `${ACTION_W}px` }}
      >
        <button
          onClick={handleHide}
          className="flex-1 flex flex-col items-center justify-center bg-zinc-600 text-white ts-meta font-medium gap-0.5"
        >
          <span>隱藏</span>
        </button>
        <button
          onClick={handleDelete}
          className="flex-1 flex flex-col items-center justify-center bg-red-500 text-white ts-meta font-medium gap-0.5"
        >
          <span>刪除</span>
        </button>
      </div>

      {/* Session 內容，左滑時向左移 */}
      <div
        style={{
          transform: swipeOffset !== 0 ? `translateX(${swipeOffset}px)` : undefined,
          transition: swipeOffset === 0 || swipeOffset === -ACTION_W
            ? "transform 240ms cubic-bezier(0.32,0.72,0,1)"
            : "none",
        }}
        className="relative w-full bg-bg-sidebar"
        onClick={swipeLocked ? closeSwipe : undefined}
      >
      <ContextMenu
        visible={contextMenuVisible}
        hide={hideContextMenu}
        context={type}
        id={id}
        mid={mid}
        pinned={pinned}
        setInviteChannelId={setInviteChannelId}
        deleteChannel={setDeleteChannelId}
        deleteDM={setDeleteDMId}
      >
        <NavLink
          ref={drop}
          className={({ isActive: linkActive }) =>
            clsx(
              `nav flex gap-2.5 rounded-md px-2.5 py-[9px] w-full transition-colors duration-200`,
              isActive && "shadow-inset-hairline",
              linkActive ? "bg-bg-surface shadow-inset-hairline" : "hover:bg-[#0f1014]"
            )
          }
          to={navPath}
          onContextMenu={handleContextMenuEvent}
        >
          <div className="flex shrink-0 relative size-7 mt-0.5">
            {type == "dm" ? (
              <User avatarSize={28} compact interactive={false} uid={id} />
            ) : (
              <Avatar
                width={28}
                height={28}
                className="icon object-cover"
                type="channel"
                name={name}
                src={icon}
              />
            )}
            {isVoicing && <IconVoicing className="top-0 -right-[7px] absolute w-4 h-4" />}
          </div>
          <div className="min-w-0 flex-1 flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between gap-1">
              <span className={clsx(`flex items-center gap-1 min-w-0`)}>
                <i
                  className={clsx(
                    "not-italic font-medium ts-msg text-[#e4e4e7] truncate",
                    !resolveMsgTime(previewMsg) && "max-w-full"
                  )}
                >
                  {type == "dm" ? <NameWithRemark uid={id} showName={false} name={name} /> : name}
                </i>
                {!is_public && <IconLock className="fill-fg-subtle shrink-0" />}
              </span>
              <span className="font-mono ts-mini text-fg-disabled shrink-0">
                {fromNowTime(resolveMsgTime(previewMsg))}
              </span>
            </div>
            <div className="flex items-center justify-between mt-px">
              <span className={clsx("ts-meta text-fg-subtle truncate", unreads > 0 ? `flex-1 mr-1` : ``)}>
                {renderPreviewMessage(previewMsg)}
              </span>
              {unreads > 0 && !isCurrentPath ? (
                <span className="flex items-center gap-0.5 shrink-0">
                  {hasMention && (
                    <strong className="font-mono ts-xs font-bold px-1.5 py-px rounded-sm bg-accent text-accent-on">
                      @
                    </strong>
                  )}
                  <strong
                    className={clsx(
                      `font-mono ts-xs font-bold px-1.5 py-px rounded-sm`,
                      muted ? "bg-fg-subtle text-bg-app" : "bg-accent text-accent-on"
                    )}
                  >
                    {unreads > 99 ? "99+" : unreads}
                  </strong>
                </span>
              ) : (
                muted && <IconMute className="w-3 h-3 fill-fg-subtle shrink-0" />
              )}
            </div>
          </div>
        </NavLink>
      </ContextMenu>
      </div>
    </li>
  );
};
export default memo(Session, (prev, next) => {
  return prev.mid == next.mid;
});
