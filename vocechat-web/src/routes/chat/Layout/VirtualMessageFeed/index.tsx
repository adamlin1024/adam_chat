import {
  useCallback,
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
  useMemo,
  useLayoutEffect
} from "react";
import { shallowEqual, useDispatch } from "react-redux";
import { Virtualizer, type VirtualizerHandle } from "virtua";
import { useDebounce } from "rooks";
import { Waveform } from "@uiball/loaders";

import { useLazyLoadMoreMessagesQuery, useReadMessageMutation } from "@/app/services/message";
import { updateHistoryMark } from "@/app/slices/footprint";
import { useAppSelector } from "@/app/store";
import { ChatContext } from "@/types/common";
import { renderMessageFragment } from "../../utils";
import NewMessageBottomTip from "../NewMessageBottomTip";
import CustomHeader from "./CustomHeader";
import FloatingDate from "./FloatingDate";
import { makeSelectVisibleMessages } from "@/app/selectors/message";
import { updateSelectMessages } from "@/app/slices/ui";

type Props = {
  context: ChatContext;
  id: number;
};

export interface VirtualMessageFeedHandle {
  scrollToMessage: (mid: number) => void;
  notifyFileSending: () => void;
}

// 滑動視窗常數：永遠只 render 視窗範圍內的訊息，避免大頻道一次塞 5000+ 進 React tree
// 觸發白屏 / 卡死。
const WINDOW_DEFAULT_SIZE = 50;       // 預設視窗大小（最近的 N 筆）
const WINDOW_GROW_CHUNK = 50;         // 每次往上 / 往下擴展的步長
const SEARCH_TARGET_BACKWARD = 200;   // 跳到搜尋結果時，target 上方保留多少筆
const SEARCH_TARGET_FORWARD = 50;     // 跳到搜尋結果時，target 下方保留多少筆
const NEAR_EDGE_THRESHOLD = 100;      // 接近邊緣的 px 門檻

const VirtualMessageFeed = forwardRef<VirtualMessageFeedHandle, Props>(({ context, id }, ref) => {
  const dispatch = useDispatch();
  const [atBottom, setAtBottom] = useState(true);
  const stickToBottomRef = useRef(true);
  // 視窗狀態：mids = allMids.slice(allMids.length - windowEndOffset - windowSize, allMids.length - windowEndOffset)
  //   windowEndOffset = 0 → 視窗底端對齊 allMids 結尾（最新訊息）
  //   windowEndOffset > 0 → 視窗底端往上偏移 N 筆（停在中段，例如跳到搜尋結果）
  //   windowSize → 視窗包含多少筆訊息
  const [windowSize, setWindowSize] = useState(WINDOW_DEFAULT_SIZE);
  const [windowEndOffset, setWindowEndOffset] = useState(0);
  // Track prepend operations so virtua's shift prop can compensate scroll position
  const isPrependRef = useRef(false);
  const [loadMoreMessage, { isLoading: loadingMore, isSuccess, data: historyData }] =
    useLazyLoadMoreMessagesQuery();
  const vRef = useRef<VirtualizerHandle | null>(null);
  const [updateReadIndex] = useReadMessageMutation();
  const updateReadDebounced = useDebounce(updateReadIndex, 500);
  const updateReadDebouncedRef = useRef(updateReadDebounced);
  updateReadDebouncedRef.current = updateReadDebounced;

  const selectVisibleMessages = useMemo(() => makeSelectVisibleMessages(), []);

  const historyMid = useAppSelector(
    (store) =>
      context == "dm"
        ? store.footprint.historyUsers[id] ?? ""
        : store.footprint.historyChannels[id] ?? "",
    shallowEqual
  );
  const allMids = useAppSelector(
    (store) =>
      context == "dm" ? store.userMessage.byId[id] ?? [] : store.channelMessage[id] ?? [],
    shallowEqual
  );

  // 滑動視窗：從 allMids 切出實際 render 範圍。windowEndOffset 控制底端對齊位置，
  // windowSize 控制寬度。永遠不超過 windowSize 筆，避免 5000+ 訊息一次塞進 React tree。
  const windowEndIdx = Math.max(0, allMids.length - windowEndOffset);
  const windowStartIdx = Math.max(0, windowEndIdx - windowSize);
  const mids = useMemo(() => {
    return allMids.slice(windowStartIdx, windowEndIdx);
  }, [allMids, windowStartIdx, windowEndIdx]);

  const prevMidsRef = useRef<number[]>([]);
  const prevMidsLenRef = useRef(0);
  const stableMids = useMemo(() => {
    if (prevMidsRef.current.length === mids.length) {
      let same = true;
      for (let i = 0; i < mids.length; i++) {
        if (prevMidsRef.current[i] !== mids[i]) {
          same = false;
          break;
        }
      }
      if (same) return prevMidsRef.current;
    }
    prevMidsRef.current = mids;
    return mids;
  }, [mids]);

  // 偵測 allMids 變動方向。Prepend（loadMoreMessage 拉舊訊息）windowEndOffset 不需動，
  // 因為 offset 是從 end 算的、prepend 不影響尾端。Append（新訊息進來）若使用者沒在
  // stick-to-bottom，要把 windowEndOffset 加 growth，視窗才會停在原本看的位置不被推走。
  const prevAllMidsRef = useRef<number[]>([]);
  useEffect(() => {
    const prev = prevAllMidsRef.current;
    const curr = allMids;
    prevAllMidsRef.current = curr;
    prevMidsLenRef.current = curr.length;

    if (prev.length === 0 || curr.length <= prev.length) return;

    const growth = curr.length - prev.length;
    // 結尾的 mid 變了 + 開頭的 mid 沒變 → append；反之為 prepend（或同時改、罕見）
    const isAppend =
      curr[curr.length - 1] !== prev[prev.length - 1] && curr[0] === prev[0];
    const isPrepend = !isAppend && curr[0] !== prev[0];

    if (isAppend && !stickToBottomRef.current) {
      setWindowEndOffset((p) => p + growth);
    }
    // Prepend（loadMoreMessage 拉舊訊息）：要擴大 windowSize，不然新拉進來的訊息
    // 不會進視窗 → 使用者看不到捲動效果。
    if (isPrepend) {
      setWindowSize((p) => p + growth);
    }
  }, [allMids]);

  const selects = useAppSelector(
    (store) => store.ui.selectMessages[`${context}_${id}`],
    shallowEqual
  );
  const loginUid = useAppSelector((store) => store.authData.user?.uid, shallowEqual);

  const toggleSelect = useCallback(
    (mid: number, selected: boolean) => {
      const operation = selected ? "remove" : "add";
      dispatch(updateSelectMessages({ context, id, operation, data: mid }));
    },
    [context, id, dispatch]
  );

  const messageData = useAppSelector((store) => selectVisibleMessages(store, stableMids));

  const readChannels = useAppSelector((store) => store.footprint.readChannels, shallowEqual);
  const readUsers = useAppSelector((store) => store.footprint.readUsers, shallowEqual);

  // Count extra virtual items before messages (header, loading spinner)
  const extraItemCount = (context === "channel" ? 1 : 0) + (loadingMore ? 1 : 0);
  const extraItemCountRef = useRef(extraItemCount);
  extraItemCountRef.current = extraItemCount;

  const scrollToBottom = useCallback(() => {
    if (vRef.current) {
      vRef.current.scrollTo(vRef.current.scrollSize);
    }
  }, []);

  // Scroll to bottom when sticking and new messages arrive
  useEffect(() => {
    if (stickToBottomRef.current && stableMids.length > 0) {
      scrollToBottom();
    }
  }, [stableMids, scrollToBottom]);

  // Reset on conversation switch
  useEffect(() => {
    setWindowSize(WINDOW_DEFAULT_SIZE);
    setWindowEndOffset(0);
    stickToBottomRef.current = true;
    setAtBottom(true);
    isPrependRef.current = false;
    prevAllMidsRef.current = [];
  }, [id]);

  // Scroll to bottom after conversation switch (after render)
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 0);
    return () => clearTimeout(timer);
  }, [id, scrollToBottom]);

  // Keep last message visible when keyboard appears/disappears (mobile)
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    let timer: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      if (!stickToBottomRef.current) return;
      clearTimeout(timer);
      timer = setTimeout(() => scrollToBottom(), 50);
    };
    vv.addEventListener("resize", handleResize);
    return () => {
      vv.removeEventListener("resize", handleResize);
      clearTimeout(timer);
    };
  }, [scrollToBottom]);

  // Reset isPrepend after layout
  useLayoutEffect(() => {
    isPrependRef.current = false;
  });

  // 用 ref 抓 allMids，讓 scrollToMessageInternal callback 不必每次 allMids 變動就重建
  const allMidsRef = useRef(allMids);
  allMidsRef.current = allMids;

  // 跳到指定 mid 的核心邏輯（搜尋結果點擊 / 點 reply 跳轉共用）
  // 關鍵：只把視窗移到 target 周圍 ~250 筆，不再 setVisibleCount(allMids.length)
  // 整個歷史塞進 React tree → 不會白屏。
  const scrollToMessageInternal = useCallback((mid: number) => {
    const list = allMidsRef.current;
    const idx = list.findIndex((m) => m === mid);
    if (idx === -1) return;

    const newEnd = Math.min(list.length, idx + 1 + SEARCH_TARGET_FORWARD);
    const newStart = Math.max(0, idx - SEARCH_TARGET_BACKWARD);
    const newSize = newEnd - newStart;
    const newEndOffset = list.length - newEnd;

    setWindowSize(newSize);
    setWindowEndOffset(newEndOffset);
    stickToBottomRef.current = false;
    isPrependRef.current = false;

    // 等視窗 state 套用 + virtua 重排，再捲到 target 的索引位置
    const targetIndexInWindow = idx - newStart;
    setTimeout(() => {
      vRef.current?.scrollToIndex(extraItemCountRef.current + targetIndexInWindow, {
        align: "center",
        smooth: true,
      });
      setTimeout(() => {
        const msgEle = document.querySelector<HTMLDivElement>(`[data-msg-mid='${mid}']`);
        if (msgEle) {
          const _class1 = `md:dark:bg-bg-elevated`;
          const _class2 = `md:bg-bg-elevated`;
          msgEle.classList.add(_class1);
          msgEle.classList.add(_class2);
          setTimeout(() => {
            msgEle.classList.remove(_class1);
            msgEle.classList.remove(_class2);
          }, 3000);
        }
      }, 500);
    }, 100);
  }, []);

  // 點 Reply 內的引用觸發的 custom event（vocechat-web 既有 pattern）
  useEffect(() => {
    const feedId = `VOCECHAT_FEED_${context}_${id}`;
    const feedEle = document.getElementById(feedId);
    const handler = (evt: Event) => {
      const detail = (evt as CustomEvent).detail;
      if (detail?.mid != null) scrollToMessageInternal(Number(detail.mid));
    };
    feedEle?.addEventListener("scrollToMessage", handler);
    return () => {
      feedEle?.removeEventListener("scrollToMessage", handler);
    };
  }, [context, id, scrollToMessageInternal]);

  useEffect(() => {
    if (isSuccess && historyData) {
      if (historyData.length == 0) {
        dispatch(updateHistoryMark({ type: context, id, mid: "reached" }));
      } else {
        const [{ mid }] = historyData;
        dispatch(updateHistoryMark({ type: context, id, mid: `${mid}` }));
      }
    }
  }, [isSuccess, historyData, stableMids, context, id]);

  // onScroll: detect atBottom state + 視窗滑動
  const handleScroll = useCallback((offset: number) => {
    if (!vRef.current) return;
    const handle = vRef.current;
    const isAtBottomOfRender = offset - handle.scrollSize + handle.viewportSize >= -50;

    // 整體底端 = 渲染底端 + 視窗底端對齊 allMids 結尾。只有這時才該設 stickToBottom
    const atOverallBottom = isAtBottomOfRender && windowEndOffset === 0;
    stickToBottomRef.current = atOverallBottom;
    setAtBottom(atOverallBottom);

    // 滑到渲染底端但視窗還沒對齊 allMids 結尾（之前跳搜尋結果停在中段）→ 視窗往下滑
    if (isAtBottomOfRender && windowEndOffset > 0) {
      isPrependRef.current = false;
      setWindowEndOffset((p) => Math.max(0, p - WINDOW_GROW_CHUNK));
    }

    // 滑到渲染頂端 → 先擴大視窗（往上加），視窗已涵蓋 allMids[0] 才向 server 拉舊訊息
    if (offset < NEAR_EDGE_THRESHOLD) {
      if (windowStartIdx > 0) {
        isPrependRef.current = true;
        // 上限是 allMids.length，避免 onScroll 連續觸發無限長大
        setWindowSize((prev) => Math.min(prev + WINDOW_GROW_CHUNK, allMids.length));
      } else if (historyMid !== "reached") {
        let lastMid = allMids[0];
        if (historyMid) {
          lastMid = +historyMid;
        }
        isPrependRef.current = true;
        loadMoreMessage({ context, id, mid: lastMid });
      }
    }
  }, [allMids, windowStartIdx, windowEndOffset, historyMid, context, id, loadMoreMessage]);

  const handleScrollBottom = useCallback(() => {
    // 用戶按「跳到最新」：視窗強制對齊到 allMids 結尾 + stick to bottom
    setWindowEndOffset(0);
    setWindowSize(WINDOW_DEFAULT_SIZE);
    stickToBottomRef.current = true;
    isPrependRef.current = false;
    // 等視窗套用後再捲到底
    setTimeout(() => scrollToBottom(), 50);
  }, [scrollToBottom]);

  useImperativeHandle(ref, () => ({
    scrollToMessage: scrollToMessageInternal,
    notifyFileSending: () => {
      // 送檔案：跳回視窗底端 + stick to bottom，確保送出後看得到自己的訊息
      setWindowEndOffset(0);
      setWindowSize(WINDOW_DEFAULT_SIZE);
      stickToBottomRef.current = true;
      requestAnimationFrame(() => {
        scrollToBottom();
      });
    }
  }));

  const readIndex = context == "channel" ? readChannels[id] : readUsers[id];

  // Store frequently changing values in refs to avoid recreating render function
  const messageDataRef = useRef(messageData);
  const midsRef = useRef(stableMids);
  const readIndexRef = useRef(readIndex);
  const loginUidRef = useRef(loginUid);
  const selectsRef = useRef(selects);
  const toggleSelectRef = useRef(toggleSelect);

  messageDataRef.current = messageData;
  midsRef.current = stableMids;
  readIndexRef.current = readIndex;
  loginUidRef.current = loginUid;
  selectsRef.current = selects;
  toggleSelectRef.current = toggleSelect;

  const renderItem = useCallback(
    (mid: number, idx: number) => {
      const curr = messageDataRef.current[mid];
      if (!curr) return <div key={mid} className="w-full h-[1px] invisible"></div>;
      const isFirst = idx == 0;
      const prev = isFirst ? null : messageDataRef.current[midsRef.current[idx - 1]];
      const read = curr?.from_uid == loginUidRef.current || mid <= readIndexRef.current;
      const selected = !!(
        selectsRef.current && selectsRef.current.find((s: number) => s == mid)
      );
      const handleToggleSelect = () => toggleSelectRef.current(mid, selected);
      return (
        <div key={mid}>
          {renderMessageFragment({
            selectMode: !!selectsRef.current,
            updateReadIndex: updateReadDebouncedRef.current,
            read,
            prev,
            curr,
            contextId: id,
            context,
            selected,
            toggleSelect: handleToggleSelect
          })}
        </div>
      );
    },
    [id, context]
  );

  const feedId = `VOCECHAT_FEED_${context}_${id}`;

  return (
    <>
      <div className="relative flex-1 flex flex-col min-h-0">
        <FloatingDate containerId={feedId} />
        <div
          id={feedId}
          className="px-0 py-4.5 overflow-x-hidden overflow-y-scroll flex-1"
        >
          <Virtualizer
            ref={vRef}
            shift={isPrependRef.current}
            onScroll={handleScroll}
          >
          {/* Channel header as first virtual item */}
          {context === "channel" && (
            <div key="__header__">
              <CustomHeader
                context={{ loadingMore, id, isChannel: true }}
              />
            </div>
          )}
          {loadingMore && (
            <div key="__loading__" className="w-full py-2 flex-center">
              <Waveform size={18} lineWeight={4} speed={1} color="#ccc" />
            </div>
          )}
          {stableMids.map((mid, idx) => renderItem(mid, idx))}
          </Virtualizer>
        </div>
      </div>
      {!atBottom && (
        <NewMessageBottomTip context={context} id={id} scrollToBottom={handleScrollBottom} />
      )}
    </>
  );
});

VirtualMessageFeed.displayName = "VirtualMessageFeed";

export default VirtualMessageFeed;
