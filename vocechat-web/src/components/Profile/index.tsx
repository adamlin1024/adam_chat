import { FC, memo, useState } from "react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";
import clsx from "clsx";

import { useGetAgoraStatusQuery } from "@/app/services/server";
import { useAppSelector } from "@/app/store";
import useUserOperation from "@/hooks/useUserOperation";
import IconCall from "@/assets/icons/call.svg";
import IconMessage from "@/assets/icons/message.svg";
import IconMore from "@/assets/icons/more.svg";
import Avatar from "../Avatar";
import Tippy from "@tippyjs/react";
import ActionSheet, { ActionSheetItem } from "../ActionSheet";
import DesktopContextMenu, { Item } from "../ContextMenu";
import { shallowEqual } from "react-redux";
const isMobileViewport = () => window.innerWidth < 768;
import Remark from "./remark";
import NicknameModal from "../NicknameModal";

interface Props {
  uid: number;
  type?: "embed" | "card";
  cid?: number;
}

const Profile: FC<Props> = ({ uid, type = "embed", cid }) => {
  const [remarkVisible, setRemarkVisible] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);
  const { data: agoraEnabled } = useGetAgoraStatusQuery();
  const { t } = useTranslation("member");
  const { t: chatTrans } = useTranslation("chat");
  const { t: ct } = useTranslation();
  const {
    canDM,
    canCopyEmail,
    copyEmail,
    startCall,
    removeFromChannel,
    canRemoveFromChannel,
    canRemove,
    removeUser,
    isAdmin,
    canUpdateRole,
    updateRole,
    canBlock,
    blockThisContact,
    canRemoveFromContact,
    removeFromContact,
  } = useUserOperation({ uid, cid });
  const data = useAppSelector((store) => store.users.byId[uid], shallowEqual);
  if (!data) return null;
  // console.log("profile", data);
  const {
    name,
    email,
    avatar,
    // introduction = "This guy has nothing to introduce",
  } = data;
  const isCard = type == "card";
  const canRemoveFromServer = !isCard && canRemove;
  const hasMore = email || canRemoveFromChannel || canRemoveFromServer;
  const iconClass = `cursor-pointer flex flex-col items-center gap-1 rounded-md px-4 py-3 text-fg-secondary bg-bg-surface hover:border-border-strong border border-border text-[12px] transition-colors duration-200`;
  const containerClass = clsx(
    `flex-center flex-col gap-1 z-[99] select-none`,
    isCard
      ? "w-[220px] overflow-hidden rounded-xl border border-border bg-bg-elevated shadow-overlay"
      : "mt-20 md:w-[432px]"
  );

  return (
    <>
      <NicknameModal uid={uid} visible={remarkVisible} updateVisible={setRemarkVisible} />
      <div className={containerClass}>
        {isCard && <div className="h-14 w-full bg-bg-surface"></div>}
        <div className={clsx("px-3.5 pb-3.5", isCard ? "" : "flex flex-col items-center gap-1")}>
          <Avatar
            width={isCard ? 64 : 80}
            height={isCard ? 64 : 80}
            className={clsx("object-cover", isCard ? "rounded-full -mt-8 ring-[3px] ring-bg-elevated" : "rounded-full w-20 h-20")}
            src={avatar}
            name={name}
          />
          <Remark uid={uid} />
          <h2 className={clsx("select-text font-bold text-fg-primary", isCard ? "mt-2 text-[16px]" : "text-lg")}>
            {name} {canDM && <span className="font-normal text-fg-muted text-[11px]">#{uid}</span>}
          </h2>
          {canCopyEmail && (
            <span className="font-mono text-[12px] text-fg-muted select-text">{email}</span>
          )}
          {canDM && (
            <ul className="mt-2.5 w-full grid grid-cols-2 gap-2">
              <NavLink to={`/chat/dm/${uid}`} className="block">
                <li className={clsx(iconClass, "w-full justify-center", isCard && "bg-accent text-accent-on border-accent hover:opacity-90")}>
                  <IconMessage className={isCard ? "fill-accent-on w-5 h-5" : "fill-accent w-5 h-5"} />
                  <span>{t("send_msg")}</span>
                </li>
              </NavLink>
              {agoraEnabled && type == "embed" && (
                <li role="button" onClick={startCall} className={iconClass}>
                  <IconCall className="fill-fg-secondary" />
                  <span>{t("call")}</span>
                </li>
              )}
              {isMobileViewport() ? (
                <>
                  <li
                    className={clsx(iconClass, "w-full justify-center", !hasMore && "opacity-40 cursor-not-allowed")}
                    onClick={() => hasMore && setSheetVisible(true)}
                  >
                    <IconMore className="fill-fg-secondary w-5 h-5" />
                    <span>{ct("more")}</span>
                  </li>
                  <ActionSheet
                    visible={sheetVisible}
                    onClose={() => setSheetVisible(false)}
                    items={([
                      { title: chatTrans("remark"), handler: () => setRemarkVisible(true) },
                      agoraEnabled && type == "card" && { title: t("call"), handler: startCall },
                      canCopyEmail && { title: t("copy_email"), handler: copyEmail },
                      canUpdateRole && {
                        title: t("roles"),
                        subs: [
                          { title: t("set_normal"), checked: !isAdmin, handler: isAdmin ? updateRole : undefined },
                          { title: t("set_admin"), checked: isAdmin, handler: !isAdmin ? updateRole : undefined },
                        ],
                      },
                      canRemoveFromChannel && { title: t("remove_from_channel"), danger: true, handler: removeFromChannel },
                      canRemoveFromContact && { title: t("remove_from_contact"), danger: true, handler: removeFromContact },
                      canBlock && { title: chatTrans("block"), danger: true, handler: blockThisContact },
                      canRemoveFromServer && { title: t("remove"), danger: true, handler: removeUser },
                    ].filter(Boolean)) as ActionSheetItem[]}
                  />
                </>
              ) : (
                <Tippy
                  disabled={!hasMore}
                  interactive
                  popperOptions={{ strategy: "fixed" }}
                  placement="auto"
                  trigger="click"
                  hideOnClick={true}
                  content={
                    <DesktopContextMenu
                      items={([
                        { title: chatTrans("remark"), handler: () => setRemarkVisible(true) },
                        agoraEnabled && type == "card" && { title: t("call"), handler: startCall },
                        canCopyEmail && { title: t("copy_email"), handler: copyEmail },
                        canUpdateRole && {
                          title: t("roles"),
                          handler: updateRole,
                          subs: [
                            { title: t("set_normal"), checked: !isAdmin, handler: updateRole },
                            { title: t("set_admin"), checked: isAdmin, handler: updateRole },
                          ],
                        },
                        canRemoveFromChannel && { title: t("remove_from_channel"), danger: true, handler: removeFromChannel },
                        canRemoveFromContact && { title: t("remove_from_contact"), danger: true, handler: removeFromContact },
                        canBlock && { title: chatTrans("block"), danger: true, handler: blockThisContact },
                        canRemoveFromServer && { title: t("remove"), danger: true, handler: removeUser },
                      ].filter(Boolean)) as Item[]}
                    />
                  }
                >
                  <li className={clsx(iconClass, "w-full justify-center", !hasMore && "opacity-40 cursor-not-allowed")}>
                    <IconMore className="fill-fg-secondary w-5 h-5" />
                    <span>{ct("more")}</span>
                  </li>
                </Tippy>
              )}
            </ul>
          )}
        </div>
      </div>
    </>
  );
};

export default memo(Profile);
