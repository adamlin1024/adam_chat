import { memo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { shallowEqual, useDispatch } from "react-redux";
import { NavLink, Outlet, useLocation, useMatch } from "react-router-dom";

import { updateRememberedNavs } from "@/app/slices/ui";
import { useAppSelector } from "@/app/store";
import Manifest from "@/components/Manifest";
import Notification from "@/components/Notification";
import ReLoginModal from "@/components/ReLoginModal";
import Tooltip from "@/components/Tooltip";
import UnreadTabTip from "@/components/UnreadTabTip";
import Voice from "@/components/Voice";
import usePreload from "@/hooks/usePreload";
import { useFontSize } from "@/hooks/useFontSize";
import FavIcon from "@/assets/icons/bookmark.svg";
import ChatIcon from "@/assets/icons/chat.svg";
import FolderIcon from "@/assets/icons/folder.svg";
import UserIcon from "@/assets/icons/user.svg";
import Menu from "./Menu";
import MobileNavs from "./MobileNavs";
import User from "./User";
import StreamStatus from "@/components/StreamStatus";

function HomePage() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const isHomePath = useMatch(`/`);
  const isChatHomePath = useMatch(`/chat`);
  const { pathname } = useLocation();
  const roleChanged = useAppSelector((store) => store.authData.roleChanged, shallowEqual);
  const guest = useAppSelector((store) => store.authData.guest, shallowEqual);
  const loginUid = useAppSelector((store) => store.authData.user?.uid ?? 0, shallowEqual);
  const isAdmin = useAppSelector((store) => store.authData.user?.is_admin ?? false, shallowEqual);
  const { chat: chatPath, user: userPath } = useAppSelector(
    (store) => store.ui.rememberedNavs,
    shallowEqual
  );
  // preload basic data (kick off SSE + prefetch; result not used to gate render)
  usePreload();
  // apply per-user font scale to :root --msg-scale
  useFontSize();
  useEffect(() => {
    if (isChatHomePath) {
      dispatch(updateRememberedNavs({ key: "chat", path: "/chat" }));
    }
  }, [isChatHomePath]);

  const isSettingPage = pathname.startsWith("/setting");
  const isChattingPage = isHomePath || pathname.startsWith("/chat");
  if (isSettingPage) {
    return <Outlet />;
  }
  // 有点绕
  const chatNav = isChatHomePath ? "/chat" : chatPath || "/chat";
  const userNav = userPath || "/users";
  return (
    <>
      <StreamStatus />
      {roleChanged && <ReLoginModal />}
      {!guest && <UnreadTabTip />}
      {!guest && <Voice />}
      <Manifest />
      {!guest && <Notification />}
      <div
        className={`vocechat-container flex w-screen h-screen bg-bg-app`}
      >
        {!guest && (
          <div
            className={`hidden md:flex h-full flex-col items-center relative w-[60px] border-r border-border-subtle transition-all`}
          >
            {loginUid && <User uid={loginUid} />}
            <nav className="flex flex-col gap-1 px-3 py-4">
              <NavLink
                className={({ isActive }) =>
                  `flex h-9 w-9 items-center justify-center rounded-lg transition-colors duration-[120ms] ${
                    isActive || isChattingPage
                      ? "bg-bg-surface shadow-inset-hairline text-accent"
                      : "text-white hover:text-white"
                  }`
                }
                to={chatNav}
              >
                {({ isActive }) => {
                  return (
                    <Tooltip tip={t("chat")}>
                      <ChatIcon className={`w-[18px] h-[18px] ${isActive || isChattingPage ? "stroke-accent fill-none" : "stroke-current fill-none"}`} />
                    </Tooltip>
                  );
                }}
              </NavLink>
              <NavLink
                className={({ isActive }) =>
                  `flex h-9 w-9 items-center justify-center rounded-lg transition-colors duration-[120ms] ${
                    isActive ? "bg-bg-surface shadow-inset-hairline text-accent" : "text-white hover:text-white"
                  }`
                }
                to={userNav}
              >
                {({ isActive }) => {
                  return (
                    <Tooltip tip={t("members")}>
                      <UserIcon className={`w-[18px] h-[18px] ${isActive ? "stroke-accent fill-none" : "stroke-current fill-none"}`} />
                    </Tooltip>
                  );
                }}
              </NavLink>
              <NavLink
                className={({ isActive }) =>
                  `flex h-9 w-9 items-center justify-center rounded-lg transition-colors duration-[120ms] ${
                    isActive ? "bg-bg-surface shadow-inset-hairline text-accent" : "text-white hover:text-white"
                  }`
                }
                to={"/favs"}
              >
                {({ isActive }) => {
                  return (
                    <Tooltip tip={t("favs")}>
                      <FavIcon className={`w-[18px] h-[18px] ${isActive ? "stroke-accent fill-none" : "stroke-current fill-none"}`} />
                    </Tooltip>
                  );
                }}
              </NavLink>
              {isAdmin && (
                <NavLink
                  className={({ isActive }) =>
                    `flex h-9 w-9 items-center justify-center rounded-lg transition-colors duration-[120ms] ${
                      isActive ? "bg-bg-surface shadow-inset-hairline text-accent" : "text-white hover:text-white"
                    }`
                  }
                  to={"/files"}
                >
                  {({ isActive }) => {
                    return (
                      <Tooltip tip={t("files")}>
                        <FolderIcon className={`w-[18px] h-[18px] ${isActive ? "stroke-accent fill-none" : "stroke-current fill-none"}`} />
                      </Tooltip>
                    );
                  }}
                </NavLink>
              )}
            </nav>
            <Menu />
          </div>
        )}
        <div className="h-full flex flex-col w-full">
          <Outlet />
        </div>
      </div>
      {!guest && <MobileNavs />}
    </>
  );
}
export default memo(HomePage);
