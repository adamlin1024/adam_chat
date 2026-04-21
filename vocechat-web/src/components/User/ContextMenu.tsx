import { FC, ReactElement, useState } from "react";
import { useTranslation } from "react-i18next";
import Tippy from "@tippyjs/react";

import useUserOperation from "@/hooks/useUserOperation";
const isMobileViewport = () => window.innerWidth < 768;
import ActionSheet, { ActionSheetItem } from "../ActionSheet";
import DesktopContextMenu, { Item } from "../ContextMenu";
import NicknameModal from "../NicknameModal";

interface Props {
  enable?: boolean;
  uid: number;
  cid?: number;
  visible: boolean;
  hide: () => void;
  children: ReactElement;
}

const UserContextMenu: FC<Props> = ({ enable = false, uid, cid, visible, hide, children }) => {
  const [remarkVisible, setRemarkVisible] = useState(false);
  const { t } = useTranslation("member");
  const { t: chatTran } = useTranslation("chat");
  const {
    blockThisContact,
    removeFromContact,
    copyEmail,
    canCopyEmail,
    startChat,
    canRemove,
    canRemoveFromContact,
    canBlock,
    canRemoveFromChannel,
    removeFromChannel,
    removeUser,
    isAdmin,
    canUpdateRole,
    updateRole,
  } = useUserOperation({ uid, cid });

  const desktopItems: Item[] = ([
    { title: t("send_msg"), handler: startChat },
    { title: chatTran("remark"), handler: () => setRemarkVisible(true) },
    canCopyEmail && { title: t("copy_email"), handler: copyEmail },
    canUpdateRole && {
      title: t("roles"),
      handler: updateRole,
      subs: [
        { title: t("set_normal"), checked: !isAdmin, handler: updateRole },
        { title: t("set_admin"), checked: isAdmin, handler: updateRole },
      ],
    },
    canRemoveFromChannel && { danger: true, title: t("remove_from_channel"), handler: removeFromChannel },
    canRemoveFromContact && { danger: true, title: t("remove_from_contact"), handler: removeFromContact },
    canBlock && { danger: true, title: chatTran("block"), handler: blockThisContact },
    canRemove && { danger: true, title: t("remove"), handler: removeUser },
  ].filter(Boolean)) as Item[];

  const sheetItems: ActionSheetItem[] = ([
    { title: t("send_msg"), handler: startChat },
    { title: chatTran("remark"), handler: () => setRemarkVisible(true) },
    canCopyEmail && { title: t("copy_email"), handler: copyEmail },
    canUpdateRole && {
      title: t("roles"),
      subs: [
        { title: t("set_normal"), checked: !isAdmin, handler: isAdmin ? updateRole : undefined },
        { title: t("set_admin"), checked: isAdmin, handler: !isAdmin ? updateRole : undefined },
      ],
    },
    canRemoveFromChannel && { danger: true, title: t("remove_from_channel"), handler: removeFromChannel },
    canRemoveFromContact && { danger: true, title: t("remove_from_contact"), handler: removeFromContact },
    canBlock && { danger: true, title: chatTran("block"), handler: blockThisContact },
    canRemove && { danger: true, title: t("remove"), handler: removeUser },
  ].filter(Boolean)) as ActionSheetItem[];

  return (
    <>
      <NicknameModal uid={uid} visible={remarkVisible} updateVisible={setRemarkVisible} />

      {/* 桌機：Tippy 右鍵選單，行為不變 */}
      {!isMobileViewport() ? (
        <Tippy
          disabled={!enable}
          visible={visible}
          followCursor="initial"
          interactive
          placement="right-start"
          popperOptions={{ strategy: "fixed" }}
          onClickOutside={hide}
          key={uid}
          content={<DesktopContextMenu hideMenu={hide} items={desktopItems} />}
        >
          {children}
        </Tippy>
      ) : (
        // 手機：直接渲染 children，long press 由外層觸發
        children
      )}

      {/* 手機專屬 ActionSheet */}
      {isMobileViewport() && (
        <ActionSheet visible={visible && enable} onClose={hide} items={sheetItems} />
      )}
    </>
  );
};

export default UserContextMenu;
