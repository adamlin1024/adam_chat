import { useMemo } from "react";
import { shallowEqual } from "react-redux";

import { useAppSelector } from "@/app/store";
import { ChatContext } from "@/types/common";

export type RecentContact = {
  type: ChatContext;       // "dm" | "channel"
  id: number;              // uid 或 gid
  lastMid: number;         // 最後一則訊息 mid（用來排序）
};

/**
 * 取最近互動過的對象列表（DM + Channel 合併，按最後訊息 mid 由新到舊）。
 * 用於 ForwardSheet 的橫向快速分享 grid。
 */
export default function useRecentContacts(limit: number = 7): RecentContact[] {
  const userMessageByUid = useAppSelector((s) => s.userMessage.byId, shallowEqual);
  const channelMessage = useAppSelector((s) => s.channelMessage, shallowEqual);
  const userIds = useAppSelector((s) => s.userMessage.ids, shallowEqual);
  const channelIds = useAppSelector((s) => s.channels.ids, shallowEqual);

  return useMemo(() => {
    const items: RecentContact[] = [];

    userIds.forEach((uid) => {
      const mids = userMessageByUid[uid];
      if (!mids || mids.length === 0) return;
      const lastMid = Math.max(...mids.map(Number));
      items.push({ type: "dm", id: uid, lastMid });
    });

    channelIds.forEach((gid) => {
      const mids = channelMessage[gid];
      if (!mids || mids.length === 0) return;
      const lastMid = Math.max(...mids.map(Number));
      items.push({ type: "channel", id: gid, lastMid });
    });

    items.sort((a, b) => b.lastMid - a.lastMid);
    return items.slice(0, limit);
  }, [userMessageByUid, channelMessage, userIds, channelIds, limit]);
}
