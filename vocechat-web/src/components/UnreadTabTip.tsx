import { useEffect, useRef } from "react";

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
  // small red dot, no number, top-right corner
  ctx.fillStyle = "#ef4444";
  ctx.beginPath();
  ctx.arc(26, 6, 6, 0, 2 * Math.PI);
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

  const originalHrefRef = useRef("");
  const originalTitleRef = useRef("");
  const faviconImgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    originalHrefRef.current = getFaviconLink().href;
    originalTitleRef.current = document.title;

    // load PNG favicon with crossOrigin for canvas compositing
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => { faviconImgRef.current = img; };
    img.src = "/favicon-32x32.png";

    return () => {
      if (originalHrefRef.current) getFaviconLink().href = originalHrefRef.current;
      document.title = originalTitleRef.current;
    };
  }, []);

  useEffect(() => {
    if (loginUid === 0) {
      if (originalTitleRef.current) document.title = originalTitleRef.current;
      return;
    }

    totalUnreads = 0;
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

    // favicon: small red dot overlay (no number), restore when no unreads
    if (totalUnreads > 0) {
      const url = drawBadge(faviconImgRef.current);
      if (url) getFaviconLink().href = url;
    } else if (originalHrefRef.current) {
      getFaviconLink().href = originalHrefRef.current;
    }

    // title: [N] prefix only when tab is hidden, always use originalTitle as base
    const baseTitle = originalTitleRef.current || document.title;
    const handler = () => {
      if (document.hidden) {
        if (totalUnreads > 0) document.title = `[${totalUnreads}] ${baseTitle}`;
      } else {
        document.title = baseTitle;
      }
    };
    document.addEventListener("visibilitychange", handler);
    if (document.hidden && totalUnreads > 0) {
      document.title = `[${totalUnreads}] ${baseTitle}`;
    } else if (!document.hidden) {
      document.title = baseTitle;
    }
    return () => {
      document.removeEventListener("visibilitychange", handler);
    };
  }, [userData, DMMap, channelMids, readChannels, messageData, loginUid, readUsers, muteChannels, muteUsers]);

  return null;
};

export default UnreadTabTip;
