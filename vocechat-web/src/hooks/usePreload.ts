import { useEffect, useState } from "react";
import dayjs from "dayjs";
import initCache, { useRehydrate } from "@/app/cache";
import { useLazyGetFavoritesQuery, useLazyLoadMoreMessagesQuery } from "@/app/services/message";
import { useLazyGetServerVersionQuery, useLazyGetSystemCommonQuery } from "@/app/services/server";
import { useLazyGetContactsQuery, useLazyGetUsersQuery } from "@/app/services/user";
import { useAppSelector } from "@/app/store";
import useLicense from "./useLicense";
import useStreaming from "./useStreaming";
import { shallowEqual } from "react-redux";

let preloadChannelMsgs = false;
const PRELOAD_TIMEOUT_MS = 15000;
export default function usePreload() {
  const [timedOut, setTimedOut] = useState(false);
  const { isLoading: loadingLicense } = useLicense(false);
  const [preloadChannelMessages] = useLazyLoadMoreMessagesQuery();
  const { rehydrate, rehydrated } = useRehydrate();
  const ready = useAppSelector((store) => store.ui.ready, shallowEqual);
  const loginUid = useAppSelector((store) => store.authData.user?.uid, shallowEqual);
  const enableContacts = useAppSelector(
    (store) => store.server.contact_verification_enable,
    shallowEqual
  );
  const expireTime = useAppSelector(
    (store) => store.authData.expireTime ?? +new Date(),
    shallowEqual
  );
  const channelIds = useAppSelector((store) => store.channels.ids, shallowEqual);
  const token = useAppSelector((store) => store.authData.token, shallowEqual);
  const isGuest = useAppSelector((store) => store.authData.guest, shallowEqual);
  const channelMessageData = useAppSelector((store) => store.channelMessage, shallowEqual);
  const { startStreaming, stopStreaming } = useStreaming();
  const [
    getFavorites,
    {
      isLoading: favoritesLoading,
      isSuccess: favoritesSuccess,
      isError: favoritesError,
      data: favorites
    }
  ] = useLazyGetFavoritesQuery();
  const [
    getUsers,
    { isLoading: usersLoading, isSuccess: usersSuccess, isError: usersError, data: users }
  ] = useLazyGetUsersQuery();
  const [getContacts, { data: contacts }] = useLazyGetContactsQuery();

  const [
    getServerVersion,
    { data: serverVersion, isSuccess: serverVersionSuccess, isError: serverVersionError, isLoading: loadingServerVersion }
  ] = useLazyGetServerVersionQuery();
  const [getSystemCommon] = useLazyGetSystemCommonQuery();
  useEffect(() => {
    // 跟著 loginUid 重跑：登出 → 清 IndexedDB → 重登後 uid 變動會重新 initCache
    // 為新 uid 建 localforage instance，rehydrate 從乾淨狀態填 redux，APIs 重抓。
    // 這樣登入後 UI 立刻有資料，不必靠硬導頁（location.replace）強制 reload。
    initCache();
    rehydrate();
    getServerVersion();
    const timer = setTimeout(() => setTimedOut(true), PRELOAD_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [loginUid]);
  // 在 guest 的时候 预取 channel 数据
  useEffect(() => {
    if (isGuest && channelIds.length > 0 && !preloadChannelMsgs) {
      const tmps = channelIds.filter((cid) => !channelMessageData[cid]);
      tmps.forEach((id) => {
        if (id) {
          preloadChannelMessages({ id, limit: 50 });
        }
      });
      preloadChannelMsgs = true;
    }
  }, [channelIds, channelMessageData, isGuest]);
  useEffect(() => {
    // 加 loginUid 進 deps：登入後（uid 從 0 → 真值）這邊重跑，重抓 users / favorites
    // / systemCommon。這配合上方 initCache+rehydrate 的 [loginUid] deps 一起，達到
    // 「登入完整重新預載」的效果，UI 立刻有資料。
    if (rehydrated && loginUid) {
      getUsers().then(() => {
        if (!isGuest) {
          getContacts();
        }
      });
      getFavorites();
      getSystemCommon();
    }
  }, [rehydrated, isGuest, loginUid]);
  const tokenAlmostExpire = dayjs().isAfter(new Date(expireTime - 20 * 1000));
  const canStreaming = !!loginUid && rehydrated && !!token && !tokenAlmostExpire && !ready;

  console.log("tttt", canStreaming, { loginUid, rehydrated, token, tokenAlmostExpire, ready });
  useEffect(() => {
    if (canStreaming) {
      // 先停掉，再连接
      stopStreaming();
      setTimeout(() => {
        startStreaming();
      }, 100);
    }
  }, [canStreaming]);
  const apisDone =
    (usersSuccess || usersError) &&
    (favoritesSuccess || favoritesError) &&
    (serverVersionSuccess || serverVersionError || timedOut);

  const hasCache = rehydrated && !!loginUid;

  return {
    loading:
      usersLoading || favoritesLoading || !rehydrated || loadingLicense || loadingServerVersion,
    error: usersError && favoritesError,
    success: hasCache || apisDone || timedOut,
    data: {
      users: enableContacts ? contacts : users,
      favorites
    }
  };
}
