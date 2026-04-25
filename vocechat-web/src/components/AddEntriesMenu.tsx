import { useState } from "react";
import { useTranslation } from "react-i18next";
import { hideAll } from "tippy.js";

import { useAppSelector } from "@/app/store";
import IconInvite from "@/assets/icons/add.person.svg";
import IconMention from "@/assets/icons/mention.svg";
import IconSearch from "@/assets/icons/search.svg";
import ChannelIcon from "./ChannelIcon";
import ChannelModal from "./ChannelModal";
import InviteModal from "./InviteModal";
import SearchUser from "./SearchUser";
import UsersModal from "./UsersModal";
import { shallowEqual } from "react-redux";
import useServerExtSetting from "../hooks/useServerExtSetting";
import { KEY_ADMIN_ONLY_INVITE } from "../app/config";

export default function AddEntriesMenu() {
  const { t } = useTranslation();
  const { getExtSetting } = useServerExtSetting();
  const onlyAdminCanInvite = getExtSetting(KEY_ADMIN_ONLY_INVITE);
  const isAdmin = useAppSelector((store) => store.authData.user?.is_admin, shallowEqual);
  const onlyAdminCreateGroup = useAppSelector(
    (store) => store.server.only_admin_can_create_group,
    shallowEqual
  );
  const dmEnable = useAppSelector((store) => store.server.dm_enable ?? true, shallowEqual);
  const searchUserEnable = useAppSelector(
    (store) => store.server.search_user_enable ?? true,
    shallowEqual
  );
  type ActiveModal = "invite" | "search" | "channel" | "users" | null;
  const [isPrivate, setIsPrivate] = useState(false);
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);

  const openModal = (modal: ActiveModal) => { hideAll(); setActiveModal(modal); };
  const closeModal = () => setActiveModal(null);

  const toggleInviteModalVisible = () => openModal(activeModal === "invite" ? null : "invite");
  const toggleSearchModalVisible = () => openModal(activeModal === "search" ? null : "search");
  const toggleUsersModalVisible = () => openModal(activeModal === "users" ? null : "users");
  const handleOpenChannelModal = (isPrivate: boolean) => { setIsPrivate(isPrivate); openModal("channel"); };
  const handleCloseModal = closeModal;

  const itemClass =
    "rounded flex items-center gap-2 text-sm font-semibold cursor-pointer px-2 py-2.5 md:hover:bg-bg-elevated/20 md:hover:bg-bg-surface/20 transition-colors duration-200";
  const iconClass = "w-5 h-5 fill-fg-body";
  const canPrivateGroup = onlyAdminCreateGroup ? isAdmin : true;
  const showInvite = isAdmin || !onlyAdminCanInvite;
  const showNewMsg = isAdmin || dmEnable;
  const showSearchPeople = isAdmin || searchUserEnable;
  return (
    <>
      <ul className="flex flex-col rounded-xl drop-shadow p-1 select-none text-fg-body bg-bg-app">
        {/* temp remove public channel */}
        {isAdmin && (
          <li className={itemClass} onClick={handleOpenChannelModal.bind(null, false)}>
            <ChannelIcon className={iconClass} />
            {t("action.new_channel")}
          </li>
        )}
        {canPrivateGroup && (
          <li className={itemClass} onClick={handleOpenChannelModal.bind(null, true)}>
            <ChannelIcon personal={true} className={iconClass} />
            {t("action.new_private_channel")}
          </li>
        )}
        {showNewMsg && (
          <li className={itemClass} onClick={toggleUsersModalVisible}>
            <IconMention className={iconClass} />
            {t("action.new_msg")}
          </li>
        )}
        {showInvite && (
          <li className={itemClass} onClick={toggleInviteModalVisible}>
            <IconInvite className={iconClass} />
            {t("action.invite_people")}
          </li>
        )}
        {showSearchPeople && (
          <li className={itemClass} onClick={toggleSearchModalVisible}>
            <IconSearch className={iconClass} />
            {t("action.search_people")}
          </li>
        )}
      </ul>
      {activeModal === "channel" && <ChannelModal personal={isPrivate} closeModal={handleCloseModal} />}
      {activeModal === "users" && <UsersModal closeModal={closeModal} />}
      {activeModal === "invite" && <InviteModal closeModal={closeModal} />}
      {activeModal === "search" && <SearchUser closeModal={closeModal} />}
    </>
  );
}
