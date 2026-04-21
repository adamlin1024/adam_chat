import { lazy, useEffect } from "react";
import toast from "react-hot-toast";
import { Provider, shallowEqual } from "react-redux";
import { HashRouter, Route, Routes } from "react-router-dom";

import Meta from "@/components/Meta";
import useDeviceToken from "@/components/Notification/useDeviceToken";
import RequireAuth from "@/components/RequireAuth";
import RequireNoAuth from "@/components/RequireNoAuth";
import RequireSingleTab from "@/components/RequireSingleTab";
import { compareVersion } from "@/utils";
import { vapidKey } from "../app/config";
import store, { useAppSelector } from "../app/store";
import NotFoundPage from "./404";
import InvitePrivate from "./invitePrivate";
import LazyIt from "./lazy";
import InviteInMobile from "./reg/InviteInMobile";
import usePrefetchData from "@/hooks/usePrefetchData";

// 主要分頁：直接 import，不做 lazy，切換時不觸發 Suspense
import ChatPage from "./chat";
import UsersPage from "./users";
import FavoritesPage from "./favs";
import FilesPage from "./files";
import HomePage from "./home";
import ResourceManagement from "./resources";

// 少用頁面：保留 lazy，減少首次載入體積
const RegBasePage = lazy(() => import("./reg"));
const RegWithUsernamePage = lazy(() => import("./reg/RegWithUsername"));
const SendMagicLinkPage = lazy(() => import("./sendMagicLink"));
const RegPage = lazy(() => import("./reg/Register"));
const LoginPage = lazy(() => import("./login"));
const OAuthPage = lazy(() => import("./oauth"));
const CallbackPage = lazy(() => import("./callback"));
const OnboardingPage = lazy(() => import("./onboarding"));
const SettingChannelPage = lazy(() => import("./settingChannel"));
const SettingDMPage = lazy(() => import("./settingDM"));
const SettingPage = lazy(() => import("./setting"));
const GuestLogin = lazy(() => import("./guest"));

let toastId: string;
const PageRoutes = () => {
  const guestMode = useAppSelector((store) => store.server.loginConfig?.guest, shallowEqual);
  const version = useAppSelector((store) => store.server.version, shallowEqual);
  const online = useAppSelector((store) => store.ui.online, shallowEqual);
  // 提前获取 device token
  useDeviceToken(vapidKey);
  // 初始化元信息
  usePrefetchData();
  // 掉线检测
  useEffect(() => {
    if (!online) {
      toastId = toast.error("Network Offline!", { duration: Infinity });
    } else if (toastId) {
      toast.dismiss(toastId);
    }
  }, [online]);
  return (
    <HashRouter>
      <Routes>
        <Route
          path="/guest_login"
          element={
            <LazyIt>
              <GuestLogin />
            </LazyIt>
          }
        />
        <Route
          path="/invite_private/:channel_id"
          element={
            <LazyIt key="invite_private">
              <RequireAuth guestMode={guestMode}>
                <InvitePrivate />
              </RequireAuth>
            </LazyIt>
          }
        />
        <Route
          path="/invite_mobile/:magic_token"
          element={
            <LazyIt key="invite_mobile">
              <RequireNoAuth>
                <InviteInMobile />
              </RequireNoAuth>
            </LazyIt>
          }
        />
        <Route
          path="/cb/:type/:payload"
          element={
            <LazyIt key="cb">
              <CallbackPage />
            </LazyIt>
          }
        />
        <Route
          path="/oauth/:token"
          element={
            <LazyIt key="oauth">
              <OAuthPage />
            </LazyIt>
          }
        />
        <Route
          path="/login"
          element={
            <LazyIt>
              <RequireNoAuth>
                <LoginPage />
              </RequireNoAuth>
            </LazyIt>
          }
        />
        <Route
          path="/send_magic_link/:email"
          element={
            <LazyIt key="send_magic_link">
              <RequireNoAuth>
                <SendMagicLinkPage />
              </RequireNoAuth>
            </LazyIt>
          }
        />

        <Route
          path="/register"
          element={
            <LazyIt key="reg">
              <RequireNoAuth>
                <RegBasePage />
              </RequireNoAuth>
            </LazyIt>
          }
        >
          <Route
            index
            element={
              <LazyIt>
                <RegPage />
              </LazyIt>
            }
          />
          <Route
            path="set_name/:from?"
            element={
              <LazyIt key="set_name">
                <RegWithUsernamePage />
              </LazyIt>
            }
          />
        </Route>
        <Route
          path="/email_login"
          element={
            <LazyIt key="email_login">
              <RequireNoAuth>
                <SendMagicLinkPage />
              </RequireNoAuth>
            </LazyIt>
          }
        />
        <Route
          path="/onboarding"
          element={
            <LazyIt key="onboarding">
              <OnboardingPage />
            </LazyIt>
          }
        />

        <Route
          key={"main"}
          path="/"
          element={
            <RequireAuth guestMode={guestMode}>
              <RequireSingleTab>
                <HomePage />
              </RequireSingleTab>
            </RequireAuth>
          }
        >
          <Route path="setting">
            <Route
              path=":nav?"
              element={
                <LazyIt key="setting">
                  <SettingPage />
                </LazyIt>
              }
            />
            <Route
              path="channel/:cid/:nav?"
              element={
                <LazyIt key="channel/:cid/:nav?">
                  <SettingChannelPage />
                </LazyIt>
              }
            />
            <Route
              path="dm/:uid/:nav?"
              element={
                <LazyIt>
                  <SettingDMPage />
                </LazyIt>
              }
            />
          </Route>
          <Route index element={<ChatPage />} />
          <Route path="chat">
            <Route index element={<ChatPage />} />
            <Route path="channel/:channel_id" element={<ChatPage />} />
            <Route path="dm/:user_id" element={<ChatPage />} />
          </Route>
          <Route path="users">
            <Route index element={<UsersPage />} />
            <Route path=":user_id" element={<UsersPage />} />
          </Route>
          <Route path="favs" element={<FavoritesPage />} />
          <Route
            path="files"
            element={compareVersion(version, "0.3.11") > -1 ? <FilesPage /> : <ResourceManagement />}
          />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </HashRouter>
  );
};

function ReduxRoutes() {
  return (
    <Provider store={store}>
      <Meta />
      <PageRoutes />
    </Provider>
  );
}
export default ReduxRoutes;
