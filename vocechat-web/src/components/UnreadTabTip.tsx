import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { shallowEqual } from "react-redux";

import { useAppSelector } from "../app/store";
import getUnreadCount from "../routes/chat/utils";

function getFaviconLink(): HTMLLinkElement {
  let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  return link;
}

function drawBadge(baseImg: HTMLImageElement | null): string {
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  if (baseImg) {
    try { ctx.drawImage(baseImg, 0, 0, 32, 32); } catch { /* tainted — skip */ }
  }
  ctx.fillStyle = "#ff2222";
  ctx.beginPath();
  ctx.arc(27, 5, 5, 0, 2 * Math.PI);
  ctx.fill();
  try { return canvas.toDataURL("image/png"); } catch { return ""; }
}

const UnreadTabTip = () => {
  const loginUid    = useAppSelector((s) => s.authData.user?.uid ?? 0, shallowEqual);
  const muteChannels = useAppSelector((s) => s.footprint.muteChannels, shallowEqual);
  const muteUsers   = useAppSelector((s) => s.footprint.muteUsers, shallowEqual);
  const readChannels = useAppSelector((s) => s.footprint.readChannels, shallowEqual);
  const readUsers   = useAppSelector((s) => s.footprint.readUsers, shallowEqual);
  const userData    = useAppSelector((s) => s.users.byId, shallowEqual);
  const DMMap       = useAppSelector((s) => s.userMessage.byId, shallowEqual);
  const channelMids = useAppSelector((s) => s.channelMessage, shallowEqual);
  const messageData = useAppSelector((s) => s.message, shallowEqual);

  const { pathname } = useLocation();
  const [isTabVisible, setIsTabVisible] = useState(!document.hidden);

  const originalHrefRef = useRef("");
  const originalTitleRef = useRef("");
  const faviconImgRef = useRef<HTMLImageElement | null>(null);
  const badgeActiveRef = useRef(false);

  // One-time init
  useEffect(() => {
    originalHrefRef.current = getFaviconLink().href;
    originalTitleRef.current = document.title;

    fetch("/neko-icon.png")
      .then((r) => r.blob())
      .then((blob) => {
        const img = new Image();
        img.onload = () => { faviconImgRef.current = img; };
        img.src = URL.createObjectURL(blob);
      })
      .catch(() => {});

    return () => {
      getFaviconLink().href = originalHrefRef.current;
      document.title = originalTitleRef.current;
      badgeActiveRef.current = false;
    };
  }, []);

  // Tab visibility
  useEffect(() => {
    const sync = () => setIsTabVisible(!document.hidden);
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  // Badge + title
  useEffect(() => {
    if (!loginUid) { document.title = originalTitleRef.current; return; }

    // Always compute the real unread total first
    let total = 0;
    for (const [id, mids] of Object.entries(DMMap)) {
      if (muteUsers[+id] || !userData[+id]) continue;
      const { unreads = 0 } = getUnreadCount({ mids, readIndex: readUsers[+id], messageData, loginUid });
      total += unreads;
    }
    for (const [id, mids] of Object.entries(channelMids)) {
      if (muteChannels[+id]) continue;
      const { unreads = 0 } = getUnreadCount({ mids, readIndex: readChannels[+id], messageData, loginUid });
      total += unreads;
    }

    // Suppress when the user is actively watching the chat page
    const onChat = pathname === "/" || pathname.startsWith("/chat");
    const count = isTabVisible && onChat ? 0 : total;

    // Favicon — only touch href on badge state transitions to avoid browser async-fetch race
    if (count > 0 && !badgeActiveRef.current) {
      const url = drawBadge(faviconImgRef.current);
      if (url) { getFaviconLink().href = url; badgeActiveRef.current = true; }
    } else if (count === 0 && badgeActiveRef.current) {
      getFaviconLink().href = originalHrefRef.current;
      badgeActiveRef.current = false;
    }

    // Title — always in sync with count
    document.title = count > 0
      ? `[${count}] ${originalTitleRef.current}`
      : originalTitleRef.current;

  }, [userData, DMMap, channelMids, readChannels, messageData, loginUid, readUsers, muteChannels, muteUsers, isTabVisible, pathname]);

  return null;
};

export default UnreadTabTip;
