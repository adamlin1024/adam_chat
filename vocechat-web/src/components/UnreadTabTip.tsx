import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

import { useAppSelector } from "../app/store";
import getUnreadCount from "../routes/chat/utils";
import { shallowEqual } from "react-redux";

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
    try {
      ctx.drawImage(baseImg, 0, 0, 32, 32);
    } catch {
      // tainted — skip background
    }
  }
  ctx.fillStyle = "#ff2222";
  ctx.beginPath();
  ctx.arc(27, 5, 5, 0, 2 * Math.PI);
  ctx.fill();
  try {
    return canvas.toDataURL("image/png");
  } catch {
    return "";
  }
}

const UnreadTabTip = () => {
  const loginUid = useAppSelector((store) => store.authData.user?.uid ?? 0, shallowEqual);
  const muteChannels = useAppSelector((store) => store.footprint.muteChannels, shallowEqual);
  const muteUsers = useAppSelector((store) => store.footprint.muteUsers, shallowEqual);
  const readChannels = useAppSelector((store) => store.footprint.readChannels, shallowEqual);
  const readUsers = useAppSelector((store) => store.footprint.readUsers, shallowEqual);
  const userData = useAppSelector((store) => store.users.byId, shallowEqual);
  const DMMap = useAppSelector((store) => store.userMessage.byId, shallowEqual);
  const channelMids = useAppSelector((store) => store.channelMessage, shallowEqual);
  const messageData = useAppSelector((store) => store.message, shallowEqual);

  const { pathname } = useLocation();
  const [isTabVisible, setIsTabVisible] = useState(!document.hidden);

  const originalHrefRef = useRef("");
  const originalTitleRef = useRef("");
  const faviconImgRef = useRef<HTMLImageElement | null>(null);
  const badgeActiveRef = useRef(false);

  useEffect(() => {
    originalHrefRef.current = getFaviconLink().href;
    originalTitleRef.current = document.title;

    fetch("/neko-icon.png")
      .then((r) => r.blob())
      .then((blob) => {
        const blobUrl = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => { faviconImgRef.current = img; };
        img.src = blobUrl;
      })
      .catch(() => {});

    return () => {
      if (originalHrefRef.current) getFaviconLink().href = originalHrefRef.current;
      document.title = originalTitleRef.current;
      badgeActiveRef.current = false;
    };
  }, []);

  useEffect(() => {
    const handleVisibility = () => setIsTabVisible(!document.hidden);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  const isOnChatPage = pathname === "/" || pathname.startsWith("/chat");

  useEffect(() => {
    if (loginUid === 0) {
      document.title = originalTitleRef.current;
      return;
    }

    // When tab is visible on any chat page, user can see messages directly → no badge
    const shouldShowBadge = !isTabVisible || !isOnChatPage;

    let totalUnreads = 0;
    if (shouldShowBadge) {
      Object.entries(DMMap).forEach(([id, mids]) => {
        if (!muteUsers[+id] && userData[+id]) {
          const { unreads = 0 } = getUnreadCount({ mids, readIndex: readUsers[+id], messageData, loginUid });
          totalUnreads += unreads;
        }
      });
      Object.entries(channelMids).forEach(([id, mids]) => {
        if (!muteChannels[+id]) {
          const { unreads = 0 } = getUnreadCount({ mids, readIndex: readChannels[+id], messageData, loginUid });
          totalUnreads += unreads;
        }
      });
    }

    // Favicon — only touch href when the badge state changes (on→off or off→on)
    // to avoid a race with the browser's async fetch of the org-logo URL.
    if (totalUnreads > 0 && !badgeActiveRef.current) {
      const url = drawBadge(faviconImgRef.current);
      if (url) {
        getFaviconLink().href = url;
        badgeActiveRef.current = true;
      }
    } else if (totalUnreads === 0 && badgeActiveRef.current) {
      getFaviconLink().href = originalHrefRef.current;
      badgeActiveRef.current = false;
    }

    // Title — tied to the same totalUnreads, no separate condition
    document.title = totalUnreads > 0
      ? `[${totalUnreads}] ${originalTitleRef.current}`
      : originalTitleRef.current;

  }, [userData, DMMap, channelMids, readChannels, messageData, loginUid, readUsers, muteChannels, muteUsers, isTabVisible, isOnChatPage]);

  return null;
};

export default UnreadTabTip;
