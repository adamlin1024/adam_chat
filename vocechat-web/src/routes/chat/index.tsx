import { memo, useEffect, useRef, useState } from "react";
import { useMatch, useParams } from "react-router-dom";
import clsx from "clsx";

import { useAppSelector } from "@/app/store";
import BlankPlaceholder from "@/components/BlankPlaceholder";
import ChannelModal from "@/components/ChannelModal";
import ErrorCatcher from "@/components/ErrorCatcher";
import Server from "@/components/Server";
import UsersModal from "@/components/UsersModal";
import ChannelChat from "./ChannelChat";
import DMChat from "./DMChat";
import GuestBlankPlaceholder from "./GuestBlankPlaceholder";
import GuestChannelChat from "./GuestChannelChat";
import GuestSessionList from "./GuestSessionList";
import RTCWidget from "./RTCWidget";
import SessionList from "./SessionList";
import VoiceFullscreen from "./VoiceFullscreen";
import { shallowEqual } from "react-redux";

const SESSION_WIDTH_KEY = "session_list_width";
const DEFAULT_WIDTH = 270;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

function ChatPage() {
  const isHomePath = useMatch(`/`);
  const isChatHomePath = useMatch(`/chat`);
  const [sessionListVisible, setSessionListVisible] = useState(false);
  const [sideWidth, setSideWidth] = useState(() => {
    const stored = localStorage.getItem(SESSION_WIDTH_KEY);
    return stored ? Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, parseInt(stored))) : DEFAULT_WIDTH;
  });
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);
  const currentWidth = useRef(sideWidth);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth.current + e.clientX - startX.current));
      currentWidth.current = newWidth;
      setSideWidth(newWidth);
    };
    const onMouseUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "none" === document.body.style.userSelect ? "" : document.body.style.userSelect;
      document.body.style.userSelect = "";
      localStorage.setItem(SESSION_WIDTH_KEY, String(currentWidth.current));
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  const handleDragStart = (e: React.MouseEvent) => {
    isDragging.current = true;
    startX.current = e.clientX;
    startWidth.current = sideWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    e.preventDefault();
  };

  const [channelModalVisible, setChannelModalVisible] = useState(false);
  const [usersModalVisible, setUsersModalVisible] = useState(false);
  const { channel_id = 0, user_id = 0 } = useParams();
  const callingTo = useAppSelector((store) => store.voice.callingTo, shallowEqual);
  const aside = useAppSelector(
    (store) =>
      channel_id
        ? store.footprint.channelAsides[+channel_id]
        : store.footprint.dmAsides[store.voice.callingTo],
    shallowEqual
  );
  const isGuest = useAppSelector((store) => store.authData.guest, shallowEqual);
  const sessionUids = useAppSelector((store) => store.userMessage.ids, shallowEqual);
  const toggleUsersModalVisible = () => {
    setUsersModalVisible((prev) => !prev);
  };
  const toggleChannelModalVisible = () => {
    setChannelModalVisible((prev) => !prev);
  };
  const toggleSessionList = () => {
    setSessionListVisible((prev) => !prev);
  };
  const tmpSession =
    user_id == 0
      ? undefined
      : sessionUids.findIndex((i) => i == +user_id) == -1
      ? {
          mid: 0,
          unread: 0,
          id: +user_id,
          type: "dm" as const
        }
      : undefined;
  // console.log("temp uid", tmpUid);
  const placeholderVisible = channel_id == 0 && user_id == 0;
  const voiceFullscreenVisible = aside === "voice_fullscreen";
  const channelChatVisible = channel_id != 0 && aside !== "voice_fullscreen";
  const dmChatVisible = user_id != 0 && aside !== "voice_fullscreen";
  const isMainPath = isHomePath || isChatHomePath;
  const context = channel_id !== 0 ? "channel" : "dm";
  const isDesktop = window.matchMedia("(min-width: 768px)").matches;
  const leftStyle = isDesktop ? { width: sideWidth, minWidth: sideWidth, maxWidth: sideWidth } : undefined;
  const contextId = (+channel_id || callingTo) ?? 0;
  console.log("fffff", channel_id, user_id, aside, channelChatVisible);

  return (
    <ErrorCatcher>
      {channelModalVisible && (
        <ChannelModal closeModal={toggleChannelModalVisible} personal={true} />
      )}
      {usersModalVisible && <UsersModal closeModal={toggleUsersModalVisible} />}
      <div
        className={clsx(
          `flex h-screen md:h-full md:pt-2 md:pb-2.5 md:pr-1`,
          isGuest ? "guest-container md:px-1" : "md:pr-12"
        )}
      >
        {sessionListVisible && (
          <div
            onClick={toggleSessionList}
            className="z-30 fixed top-0 left-4 w-screen h-screen bg-black/50 transition-all backdrop-blur-sm"
          ></div>
        )}
        <div
          className={clsx(
            "left-container flex-col md:rounded-l-lg w-full h-screen md:h-full bg-bg-sidebar",
            isMainPath ? "flex" : "hidden md:flex"
          )}
          style={leftStyle}
        >
          <Server readonly={isGuest} />
          {isGuest ? <GuestSessionList /> : <SessionList tempSession={tmpSession} />}
          <RTCWidget id={+contextId} context={context} />
        </div>
        {/* Resizable divider — desktop only */}
        <div
          className="hidden md:flex items-center justify-center w-2 flex-shrink-0 cursor-col-resize group"
          onMouseDown={handleDragStart}
        >
          <div className="w-px h-full bg-border-subtle group-hover:bg-accent/50 transition-colors duration-150" />
        </div>
        <div
          className={clsx(
            `right-container md:rounded-r-lg flex-1 min-w-0 bg-bg-canvas`,
            placeholderVisible && "h-full flex-center",
            isMainPath && "hidden md:flex"
          )}
        >
          {voiceFullscreenVisible && <VoiceFullscreen id={contextId} context={context} />}
          {placeholderVisible && (isGuest ? <GuestBlankPlaceholder /> : <BlankPlaceholder />)}
          {channelChatVisible &&
            (isGuest ? <GuestChannelChat cid={+channel_id} /> : <ChannelChat cid={+channel_id} />)}
          {dmChatVisible && <DMChat uid={+user_id} />}
        </div>
      </div>
    </ErrorCatcher>
  );
}
export default memo(ChatPage);
