import { useEffect, useMemo, useState } from "react";
import { shallowEqual, useDispatch } from "react-redux";
import dayjs from "dayjs";

import { useAppSelector } from "@/app/store";
import { useLazyLoadMoreMessagesQuery } from "@/app/services/message";
import { updateHistoryMark } from "@/app/slices/footprint";
import { ChatContext } from "@/types/common";
import Avatar from "@/components/Avatar";
import IconSearch from "@/assets/icons/search.svg";
import IconClose from "@/assets/icons/close.circle.svg";

interface Props {
  context: ChatContext;
  id: number;
  onLocate: (mid: number) => void;
  // header mode: input is embedded in header, controlled externally
  headerInputMode?: boolean;
  onHide?: () => void;
}

// 漸進搜尋：vocechat-server 沒有 server 端搜尋 endpoint，只能在已載入訊息上做前端 filter。
// 為了能找到「沒滑到那段歷史」的舊訊息，搜尋打開期間自動在背景一頁一頁拉 server 歷史，
// 拉到的訊息進 Redux 之後，filter 重算 → 結果即時長出來。直到 reached 或使用者關閉搜尋。
const HISTORY_BATCH_LIMIT = 200;

export default function MessageSearch({ context, id, onLocate, headerInputMode = false, onHide }: Props) {
  const dispatch = useDispatch();
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(false);

  const mids = useAppSelector(
    (store) => (context === "channel" ? store.channelMessage[id] : store.userMessage.byId[id]) || [],
    shallowEqual
  );
  const messageData = useAppSelector((store) => store.message, shallowEqual);
  const usersData = useAppSelector((store) => store.users.byId, shallowEqual);
  const historyMid = useAppSelector(
    (store) =>
      context === "channel"
        ? store.footprint.historyChannels[id] ?? ""
        : store.footprint.historyUsers[id] ?? "",
    shallowEqual
  );
  const reached = historyMid === "reached";

  const [loadMore, { isLoading: loadingMore, isSuccess, data: historyData, originalArgs }] =
    useLazyLoadMoreMessagesQuery();

  // 拉回的歷史寫進 Redux 後（loadMoreMessages 的 onQueryStarted 已 dispatch handleChatMessage），
  // 這裡只負責更新 historyMid 標記（reached 或下次往前的 anchor）。
  useEffect(() => {
    if (!isSuccess || !historyData) return;
    if (historyData.length === 0) {
      dispatch(updateHistoryMark({ type: context, id, mid: "reached" }));
    } else {
      const [{ mid }] = historyData;
      dispatch(updateHistoryMark({ type: context, id, mid: `${mid}` }));
    }
  }, [isSuccess, historyData, context, id, dispatch]);

  // 搜尋啟動 + 還沒拉滿歷史 + 沒在 loading → 拉下一批舊訊息
  useEffect(() => {
    if (!query.trim()) return;
    if (loadingMore || reached) return;
    if (!mids.length) return;
    let lastMid = mids[0];
    if (historyMid && historyMid !== "reached") {
      lastMid = +historyMid;
    }
    // 防止對同一個 mid 重複拉（RTK dedup 會擋網路 call，但這裡再加一層保險避免 effect 抖）
    if (originalArgs && originalArgs.mid === lastMid) return;
    loadMore({ context, id, mid: lastMid, limit: HISTORY_BATCH_LIMIT });
  }, [query, mids, loadingMore, reached, historyMid, context, id, loadMore, originalArgs]);

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    const lowerQuery = query.toLowerCase();
    return mids
      .map((mid) => messageData[mid])
      .filter((msg) => {
        if (!msg || !msg.content) return false;
        if (msg.content_type === "text/plain" || msg.content_type === "text/markdown") {
          const content = typeof msg.content === "string" ? msg.content : "";
          return content.toLowerCase().includes(lowerQuery);
        }
        return false;
      })
      .sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
  }, [query, mids, messageData]);

  const handleLocate = (mid: number) => {
    onLocate(mid);
    if (headerInputMode) {
      onHide?.();
    } else {
      setVisible(false);
    }
    setQuery("");
  };

  const handleClose = () => {
    setQuery("");
    if (headerInputMode) {
      onHide?.();
    } else {
      setVisible(false);
    }
  };

  // 狀態列：總筆數 + 搜尋中 / 已搜尋完
  const StatusBar = query.trim() ? (
    <div className="px-3 py-1.5 border-b border-border-subtle flex items-center justify-between text-xs">
      <span className="text-fg-secondary">
        {searchResults.length === 0 && !reached
          ? "搜尋中…"
          : searchResults.length === 0 && reached
            ? "未找到匹配的訊息"
            : `共 ${searchResults.length} 筆`}
      </span>
      {!reached && (
        <span className="text-fg-muted">
          {loadingMore ? "載入舊訊息中…" : "繼續搜尋舊訊息…"}
        </span>
      )}
      {reached && searchResults.length > 0 && (
        <span className="text-fg-muted">已搜尋完整個頻道</span>
      )}
    </div>
  ) : null;

  const ResultRow = (msg: any) => {
    const user = usersData[msg.from_uid || 0];
    return (
      <div
        key={msg.mid}
        onClick={() => handleLocate(msg.mid)}
        className="px-3 py-2.5 flex items-start gap-2.5 hover:bg-bg-surface cursor-pointer border-b border-border-subtle last:border-0 transition-colors"
      >
        <Avatar width={24} height={24} src={user?.avatar} name={user?.name} className="rounded-full shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2 mb-0.5">
            <span className="text-sm font-semibold tracking-tight text-fg-primary truncate">
              {user?.name}
            </span>
            <span className="font-mono ts-2xs text-fg-disabled whitespace-nowrap">
              {dayjs(msg.created_at).isSame(dayjs(), "day")
                ? dayjs(msg.created_at).format("HH:mm")
                : dayjs(msg.created_at).format("MM-DD HH:mm")}
            </span>
          </div>
          <div className="ts-meta text-fg-subtle line-clamp-2 leading-[1.55]">
            {typeof msg.content === "string" ? msg.content : ""}
          </div>
        </div>
      </div>
    );
  };

  const ResultsPanel = (
    <div className="absolute left-0 right-0 top-full bg-bg-elevated border-b border-border shadow-overlay z-50">
      {StatusBar}
      <div className="max-h-80 overflow-y-auto no-scrollbar">
        {searchResults.map((msg) => ResultRow(msg))}
      </div>
    </div>
  );

  // Header input mode: just the input bar (parent embeds this inside the header)
  if (headerInputMode) {
    return (
      <div className="flex-1 flex items-center gap-2 relative">
        <IconSearch className="w-4 h-4 fill-fg-subtle shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜尋訊息..."
          className="flex-1 text-sm text-fg-body placeholder:text-fg-disabled bg-transparent outline-none"
          autoFocus
        />
        <button onClick={handleClose} className="flex-center p-1">
          <IconClose className="w-4 h-4 fill-fg-subtle hover:fill-fg-secondary" />
        </button>
        {query && ResultsPanel}
      </div>
    );
  }

  // Default mode: toggle button + dropdown
  return (
    <div className="relative">
      <button
        onClick={() => setVisible(!visible)}
        className={`h-7 w-7 flex-center rounded-md border transition-colors ${visible ? "border-border-strong bg-bg-surface text-fg-primary" : "border-transparent text-fg-subtle hover:border-border hover:text-fg-secondary"}`}
      >
        <IconSearch className="fill-current" style={{ width: "1.2rem", height: "1.2rem" }} />
      </button>

      {visible && (
        <div className="absolute top-full right-0 mt-2 w-[300px] bg-bg-elevated border border-border rounded-xl shadow-overlay z-50">
          <div className="px-3 py-2.5 border-b border-border-subtle">
            <div className="flex items-center gap-2">
              <IconSearch className="w-3.5 h-3.5 fill-fg-subtle shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜尋訊息..."
                className="flex-1 font-mono ts-meta text-fg-body placeholder:text-fg-disabled bg-transparent outline-none"
                autoFocus
              />
              <button onClick={handleClose} className="flex-center">
                <IconClose className="w-3.5 h-3.5 fill-fg-subtle hover:fill-fg-secondary" />
              </button>
            </div>
          </div>
          {StatusBar}
          <div className="max-h-80 overflow-y-auto no-scrollbar">
            {searchResults.map((msg) => ResultRow(msg))}
          </div>
        </div>
      )}
    </div>
  );
}
