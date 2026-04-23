import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

import { useAppSelector } from "../app/store";
import getUnreadCount from "../routes/chat/utils";
import { shallowEqual } from "react-redux";

let totalUnreads = 0;

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
    };
  }, []);

  useEffect(() => {
    const handleVisibility = () => setIsTabVisible(!document.hidden);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  // Parse which chat the user is currently viewing
  const activeDMUid = pathname.match(/^\/chat\/dm\/(\d+)/)?.[1];
  const activeChannelId = pathname.match(/^\/chat\/channel\/(\d+)/)?.[1];

  useEffect(() => {
    if (loginUid === 0) {
      if (originalTitleRef.current) document.title = originalTitleRef.current;
      return;
    }

    totalUnreads = 0;
    Object.entries(DMMap).forEach(([id, mids]) => {
      if (!muteUsers[+id] && userData[+id]) {
        // Tab visible + currently in this DM → don't count its unreads
        if (isTabVisible && activeDMUid && +id === +activeDMUid) return;
        const { unreads = 0 } = getUnreadCount({ mids, readIndex: readUsers[+id], messageData, loginUid });
        totalUnreads += unreads;
      }
    });
    Object.entries(channelMids).forEach(([id, mids]) => {
      if (!muteChannels[+id]) {
        // Tab visible + currently in this channel → don't count its unreads
        if (isTabVisible && activeChannelId && +id === +activeChannelId) return;
        const { unreads = 0 } = getUnreadCount({ mids, readIndex: readChannels[+id], messageData, loginUid });
        totalUnreads += unreads;
      }
    });

    if (totalUnreads > 0) {
      const url = drawBadge(faviconImgRef.current);
      if (url) getFaviconLink().href = url;
    } else if (originalHrefRef.current) {
      getFaviconLink().href = originalHrefRef.current;
    }

    const baseTitle = originalTitleRef.current || document.title;
    if (totalUnreads > 0) {
      document.title = `[${totalUnreads}] ${baseTitle}`;
    } else {
      document.title = baseTitle;
    }
  }, [userData, DMMap, channelMids, readChannels, messageData, loginUid, readUsers, muteChannels, muteUsers, isTabVisible, pathname]);

  return null;
};

export default UnreadTabTip;
