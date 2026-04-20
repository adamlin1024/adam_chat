// @ts-nocheck
import { FC, useEffect, useState, memo } from "react";
import { useDrop } from "react-dnd";
import { NativeTypes } from "react-dnd-html5-backend";
import { NavLink, useMatch, useNavigate } from "react-router-dom";
import clsx from "clsx";

import { useAppSelector } from "@/app/store";
import { ChatContext } from "@/types/common";
import Avatar from "@/components/Avatar";
import User from "@/components/User";
import useContextMenu from "@/hooks/useContextMenu";
import useUploadFile from "@/hooks/useUploadFile";
import { fromNowTime } from "@/utils";
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
  setInviteChannelId: (param: number) => void;
}
const Session: FC<IProps> = ({
  type = "dm",
  pinned = false,
  id,
  mid,
  setDeleteChannelId,
  setInviteChannelId,
}) => {
  const navPath = type == "dm" ? `/chat/dm/${id}` : `/chat/channel/${id}`;
  // const { pathname } = useLocation();
  const isCurrentPath = useMatch(navPath);
  const navigate = useNavigate();
  const { addStageFile } = useUploadFile({ context: type, id });

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
  const { visible: contextMenuVisible, handleContextMenuEvent, hideContextMenu } = useContextMenu();
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
  const previewMsg = messageData[mid] || {};
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
    <li className={clsx("session")}>
      <ContextMenu
        visible={contextMenuVisible}
        hide={hideContextMenu}
        context={type}
        id={id}
        mid={mid}
        pinned={pinned}
        setInviteChannelId={setInviteChannelId}
        deleteChannel={setDeleteChannelId}
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
                    "not-italic font-medium text-[15px] text-[#e4e4e7] truncate",
                    !previewMsg.created_at && "max-w-full"
                  )}
                >
                  {type == "dm" ? <NameWithRemark uid={id} showName={false} name={name} /> : name}
                </i>
                {!is_public && <IconLock className="fill-fg-subtle shrink-0" />}
              </span>
              <span className="font-mono text-[12px] text-fg-disabled shrink-0">
                {fromNowTime(previewMsg.created_at)}
              </span>
            </div>
            <div className="flex items-center justify-between mt-px">
              <span className={clsx("text-[13px] text-fg-subtle truncate", unreads > 0 ? `flex-1 mr-1` : ``)}>
                {renderPreviewMessage(previewMsg)}
              </span>
              {unreads > 0 && !isCurrentPath ? (
                <span className="flex items-center gap-0.5 shrink-0">
                  {hasMention && (
                    <strong className="font-mono text-[11px] font-bold px-1.5 py-px rounded-sm bg-accent text-accent-on">
                      @
                    </strong>
                  )}
                  <strong
                    className={clsx(
                      `font-mono text-[11px] font-bold px-1.5 py-px rounded-sm`,
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
    </li>
  );
};
export default memo(Session, (prev, next) => {
  return prev.mid == next.mid;
});
