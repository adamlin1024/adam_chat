import React from "react";
import { NavLink, useLocation, useMatch } from "react-router-dom";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

import ChatIcon from "@/assets/icons/chat.svg";
import SettingIcon from "@/assets/icons/setting.svg";
import UserIcon from "@/assets/icons/user.svg";
import { useAppSelector } from "../../app/store";
import { shallowEqual } from "react-redux";

// type Props = {}

const MobileNavs = () => {
  const { t } = useTranslation("common");
  const isHomePath = useMatch(`/`);
  const { pathname } = useLocation();
  const isChatHomePath = useMatch(`/chat`);
  const isDMChat = useMatch(`/chat/dm/:user_id`);
  // const isSettingPage = useMatch(`/setting`);
  const isChannelChat = useMatch(`/chat/channel/:channel_id`);
  const { chat: chatPath, user: userPath } = useAppSelector(
    (store) => store.ui.rememberedNavs,
    shallowEqual
  );

  const linkClass = `flex`;
  const isChatPage = isHomePath || pathname.startsWith("/chat");
  const isChattingPage = !!isDMChat || !!isChannelChat;
  // console.log("rrr", isDMChat, isChannelChat);

  // 有点绕
  const chatNav = isChatHomePath ? "/chat" : chatPath || "/chat";
  const userNav = userPath || "/users";
  return (
    <ul
      className={clsx(
        "flex justify-around pt-2 pb-safe fixed bottom-0 left-0 w-full bg-bg-elevated border-t border-border-subtle md:hidden",
        isChattingPage && "hidden"
      )}
    >
      <li>
        <NavLink className={() => `${linkClass}`} to={chatNav}>
          {({ isActive }) => {
            const active = isActive || isChatPage;
            return (
              <div className="flex flex-col gap-1 items-center px-4 py-1">
                <ChatIcon className={!active ? "fill-fg-subtle" : "fill-accent"} />
                <span className={clsx("text-xs", !active ? "text-fg-muted" : "text-accent")}>
                  {t("chat")}
                </span>
              </div>
            );
          }}
        </NavLink>
      </li>
      <li>
        <NavLink className={() => `${linkClass}`} to={userNav}>
          {({ isActive: active }) => {
            return (
              <div className="flex flex-col gap-1 items-center px-4 py-1">
                <UserIcon className={!active ? "fill-fg-subtle" : "fill-accent"} />
                <span className={clsx("text-xs", !active ? "text-fg-muted" : "text-accent")}>
                  {t("members")}
                </span>
              </div>
            );
          }}
        </NavLink>
      </li>
      <li>
        <NavLink className={() => `${linkClass}`} to={"/setting"}>
          {({ isActive: active }) => {
            return (
              <div className="flex flex-col gap-1 items-center px-4 py-1">
                <SettingIcon
                  className={clsx("w-6 h-6", !active ? "fill-fg-subtle" : "fill-accent")}
                />
                <span className={clsx("text-xs", !active ? "text-fg-muted" : "text-accent")}>
                  {t("setting")}
                </span>
              </div>
            );
          }}
        </NavLink>
      </li>
    </ul>
  );
};

export default MobileNavs;
