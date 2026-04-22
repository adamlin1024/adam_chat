import { useEffect, useRef } from "react";

import { useAppSelector } from "../app/store";
import getUnreadCount from "../routes/chat/utils";
import { shallowEqual } from "react-redux";

let totalUnreads = 0;
let savedTitle = "";

function getFaviconLink(): HTMLLinkElement {
  let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  return link;
}

function drawFaviconBadge(img: HTMLImageElement | null, count: number): string {
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  if (img) ctx.drawImage(img, 0, 0, 32, 32);
  if (count > 0) {
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.arc(26, 6, 7, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = `bold ${count > 9 ? "7" : "9"}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(count > 99 ? "99" : String(count), 26, 6);
  }
  return canvas.toDataURL("image/png");
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

  const faviconImgRef = useRef<HTMLImageElement | null>(null);
  const faviconReadyRef = useRef(false);
  const originalHrefRef = useRef("");

  useEffect(() => {
    const link = getFaviconLink();
    originalHrefRef.current = link.href;
    const img = new Image();
    img.onload = () => {
      faviconImgRef.current = img;
      faviconReadyRef.current = true;
      const url = drawFaviconBadge(img, totalUnreads);
      if (url) getFaviconLink().href = url;
    };
    img.onerror = () => {
      faviconReadyRef.current = true;
    };
    img.src = link.href;
    return () => {
      if (originalHrefRef.current) getFaviconLink().href = originalHrefRef.current;
    };
  }, []);

  useEffect(() => {
    if (loginUid === 0) {
      if (savedTitle) document.title = savedTitle;
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

    // favicon badge — always visible
    if (faviconReadyRef.current) {
      const url = drawFaviconBadge(faviconImgRef.current, totalUnreads);
      if (url) getFaviconLink().href = url;
    }

    // title — only when tab is hidden
    const handler = () => {
      if (document.hidden) {
        savedTitle = document.title;
        if (totalUnreads > 0) document.title = `[${totalUnreads}] ${savedTitle}`;
      } else {
        if (savedTitle) document.title = savedTitle;
      }
    };
    document.addEventListener("visibilitychange", handler);
    if (document.hidden && totalUnreads > 0) {
      savedTitle = document.title;
      document.title = `[${totalUnreads}] ${savedTitle}`;
    }
    return () => {
      document.removeEventListener("visibilitychange", handler);
    };
  }, [userData, DMMap, channelMids, readChannels, messageData, loginUid, readUsers, muteChannels, muteUsers]);

  return null;
};

export default UnreadTabTip;
