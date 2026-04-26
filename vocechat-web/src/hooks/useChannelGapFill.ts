import { useEffect, useRef } from "react";
import { shallowEqual } from "react-redux";

import { messageApi } from "@/app/services/message";
import { updateHistoryMark } from "@/app/slices/footprint";
import { useAppDispatch, useAppSelector } from "@/app/store";
import { ChatContext } from "@/types/common";

// 每批拉取上限。100 筆是平衡：
//   - 太大 → 單次傳輸久、卡第一個畫面
//   - 太小 → 補大 gap 要很多輪
const BATCH_LIMIT = 100;
// 安全上限：避免邊緣情況（server bug、無限遞迴）把整個頻道歷史拉爆
const MAX_FORWARD_BATCHES = 50;

/**
 * 進頻道（或 DM）時，雙向驗證本機 cache 跟 server 的「最新」與「最舊」端：
 *
 * 場景：使用者在 A 裝置看到的訊息，B 裝置可能沒有 — vocechat SSE 只在連線時推送、
 * 離線錯過的不會自動回灌。同時，若先前某 session 的 loadMore 因 transient 失敗
 * 把 historyMid 錯誤標成 `reached`，使用者就再也滾不到舊訊息（搜尋也搜不到）。
 *
 * 流程（兩段 — forward 補新、backward 驗舊）：
 *
 * 1. **Forward fill**：從 server 最新一批往前走，直到撞上 cache lastKnownMid
 *    或 server 回 0（最早）。這段補「離線時錯過的新訊息」。
 *
 * 2. **Backward verify**：對 cache 最舊 mid 發 1 次 `loadMore({ before })`：
 *    - 回 0 筆 → server 真的沒更舊了，標 `reached`
 *    - 回 >0 筆 → 順手把訊息進 Redux，並更新 historyMid 為新的最舊 mid，
 *      之後 scroll-up 才能繼續拉
 *
 *    這一段是底層解法 — **不信任**持久化的 `reached` 標記，每次進頻道重新驗證。
 *    避免「之前某 session 錯標 reached 後，永遠無法再拉舊訊息」的死局。
 *
 * 邊界：cache 全空（lastKnownMid = null）時 forward 只拉一批就停（首次造訪不要
 * burst 拉完整段歷史，使用者後續會自然滑動觸發拉取）；backward verify 跳過。
 */
export default function useChannelGapFill(context: ChatContext, id: number) {
  const dispatch = useAppDispatch();
  const allMids = useAppSelector(
    (s) =>
      (context === "channel" ? s.channelMessage[id] : s.userMessage.byId[id]) || [],
    shallowEqual
  );
  // 用 ref 抓 allMids，避免 effect 因 allMids 變動（補進來的訊息）重新觸發 → 無限迴圈
  const allMidsRef = useRef<number[]>(allMids);
  allMidsRef.current = allMids;

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    (async () => {
      // 快照進入瞬間的 cache 兩端 mid，這個 effect 跑期間不再變
      const snap = allMidsRef.current;
      const hasCache = snap && snap.length > 0;
      const lastKnownMid = hasCache ? snap[snap.length - 1] : null;
      const oldestKnownMid = hasCache ? snap[0] : null;

      // ── Forward fill ─────────────────────────────────────────────────────
      let beforeMid: number | undefined = undefined;
      let batches = 0;
      while (batches < MAX_FORWARD_BATCHES && !cancelled) {
        batches++;
        try {
          const result = await dispatch(
            messageApi.endpoints.loadMoreMessages.initiate(
              { context, id, mid: beforeMid, limit: BATCH_LIMIT },
              { forceRefetch: true }
            )
          );
          if (cancelled) return;
          const messages = result.data ?? [];
          if (messages.length === 0) break; // server 回空 → 已到頻道最早，前段補完

          // cache 全空 → 拉一批就停（首次造訪不 burst）
          if (lastKnownMid === null) break;

          // 拉到的這批含 mid <= lastKnownMid → 接上 cache tail，前段補完
          const minMidInBatch = messages.reduce(
            (acc, m) => (m.mid < acc ? m.mid : acc),
            messages[0].mid
          );
          if (minMidInBatch <= lastKnownMid) break;

          // 還沒撞到 cache → 用這批最舊 mid 當下次 anchor，繼續往前走
          beforeMid = minMidInBatch;
        } catch {
          break; // 網路錯誤 / token 過期：靜默放棄前段
        }
      }

      // ── Backward verify ──────────────────────────────────────────────────
      // cache 最舊 mid 之前到底還有沒有訊息？問 server 一次，順便修正可能錯標的 reached。
      if (cancelled) return;
      if (oldestKnownMid === null) return; // 沒 cache 不需要 verify
      try {
        const result = await dispatch(
          messageApi.endpoints.loadMoreMessages.initiate(
            { context, id, mid: oldestKnownMid, limit: BATCH_LIMIT },
            { forceRefetch: true }
          )
        );
        if (cancelled) return;
        const messages = result.data ?? [];
        if (messages.length === 0) {
          // server 真的沒更舊 → 標 reached（這是「正確的」reached）
          dispatch(updateHistoryMark({ type: context, id, mid: "reached" }));
        } else {
          // 有更舊的訊息 → 訊息已經被 onQueryStarted 灌進 Redux；historyMid 設為這批最舊 mid，
          // 後續 scroll-up 才能繼續往前拉
          const newOldestMid = messages.reduce(
            (acc, m) => (m.mid < acc ? m.mid : acc),
            messages[0].mid
          );
          dispatch(updateHistoryMark({ type: context, id, mid: `${newOldestMid}` }));
        }
      } catch {
        // 失敗就不動 historyMid，下次進頻道再 verify
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [context, id, dispatch]);
}
