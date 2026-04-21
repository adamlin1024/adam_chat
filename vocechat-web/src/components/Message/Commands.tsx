import { FC, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import Tippy from "@tippyjs/react";
import clsx from "clsx";
import { hideAll } from "tippy.js";

import { updateSelectMessages } from "@/app/slices/ui";
import { ChatContext } from "@/types/common";
import useFavMessage from "@/hooks/useFavMessage";
import useSendMessage from "@/hooks/useSendMessage";
import IconBookmark from "@/assets/icons/bookmark.add.svg";
import IconDelete from "@/assets/icons/delete.svg";
import IconEdit from "@/assets/icons/edit.svg";
import IconForward from "@/assets/icons/forward.svg";
import IconMore from "@/assets/icons/more.svg";
import IconPin from "@/assets/icons/pin.svg";
import IconReact from "@/assets/icons/reaction.svg";
import IconReply from "@/assets/icons/reply.svg";
import IconSelect from "@/assets/icons/select.svg";
import ContextMenu, { Item } from "../ContextMenu";
import Tooltip from "../Tooltip";
import ReactionPicker from "./ReactionPicker";
import useMessageOperation from "./useMessageOperation";

type Props = {
  isSelf: boolean;
  context: ChatContext;
  contextId: number;
  mid: number;
  toggleEditMessage: () => void;
};
const Commands: FC<Props> = ({
  isSelf,
  context = "dm",
  contextId = 0,
  mid = 0,
  toggleEditMessage
}) => {
  const { t } = useTranslation();
  const {
    canDelete,
    canReply,
    canEdit,
    canPin,
    unPin,
    pinned,
    toggleDeleteModal,
    toggleForwardModal,
    togglePinModal,
    PinModal,
    DeleteModal,
    ForwardModal
  } = useMessageOperation({ mid, context, contextId });
  const { setReplying } = useSendMessage({ context, to: contextId });
  const { addFavorite, isFavorited } = useFavMessage({
    cid: context == "channel" ? contextId : null
  });
  const dispatch = useDispatch();
  const [tippyVisible, setTippyVisible] = useState(false);
  const cmdsRef = useRef(null);
  const handleReply = () => {
    if (contextId) {
      setReplying(mid);
    }
    hideAll();
  };

  const handleTippyVisible = (visible = true) => {
    setTippyVisible(visible);
  };
  const handleSelect = (mid: number) => {
    dispatch(updateSelectMessages({ context, id: contextId, data: mid }));
    hideAll();
  };
  const handleUnpin = () => {
    hideAll();
    unPin(mid);
  };
  const handleAddFav = async () => {
    hideAll();
    const faved = isFavorited(mid);
    if (faved) {
      toast.success("Favorited!");
      return;
    }
    const added = await addFavorite(mid);
    if (added) {
      toast.success("Added Favorites!");
    } else {
      toast.error("Added Favorites Failed!");
    }
  };
  const cmdClass = `flex h-9 w-9 cursor-pointer items-center justify-center rounded-sm border border-border bg-bg-app hover:border-border-strong hover:text-fg-primary text-fg-subtle transition-colors`;
  return (
    <>
      <ul
        ref={cmdsRef}
        className={clsx(
          `bg-bg-app border border-border rounded-md z-[999] absolute top-0 -translate-y-1/2 flex items-center gap-0.5 p-0.5 shadow-dropdown invisible group-hover:visible`,
          tippyVisible && "!visible",
          isSelf ? "left-2.5" : "right-2.5"
        )}
      >
        <Tippy
          onShow={handleTippyVisible.bind(null, true)}
          onHide={handleTippyVisible.bind(null, false)}
          interactive
          placement="top-start"
          trigger="click"
          content={<ReactionPicker mid={mid} hidePicker={hideAll} />}
        >
          <li className={cmdClass}>
            <Tooltip placement="top" tip={t("action.add_reaction")}>
              <IconReact className="w-5 h-5 fill-fg-subtle" />
            </Tooltip>
          </li>
        </Tippy>
        {canEdit && (
          <li className={cmdClass} onClick={toggleEditMessage}>
            <Tooltip placement="top" tip={t("action.edit")}>
              <IconEdit className="w-5 h-5 fill-fg-subtle" />
            </Tooltip>
          </li>
        )}
        {canReply && (
          <li className={cmdClass} onClick={handleReply}>
            <Tooltip placement="top" tip={t("action.reply")}>
              <IconReply className="w-5 h-5 fill-fg-subtle" />
            </Tooltip>
          </li>
        )}
        <li className={cmdClass} onClick={handleAddFav}>
          <Tooltip placement="top" tip={t("action.add_to_fav")}>
            <IconBookmark className="w-4.5 h-4.5 fill-fg-subtle" />
          </Tooltip>
        </li>
        <Tippy
          onShow={handleTippyVisible.bind(null, true)}
          onHide={handleTippyVisible.bind(null, false)}
          interactive
          placement="top-start"
          trigger="click"
          content={
            <ContextMenu
              items={
                [
                  canPin && {
                    title: pinned ? t("action.unpin") : t("action.pin"),
                    icon: <IconPin className="icon" />,
                    handler: pinned ? handleUnpin : togglePinModal
                  },
                  {
                    title: t("action.forward"),
                    icon: <IconForward className="icon" />,
                    handler: toggleForwardModal
                  },
                  {
                    title: t("action.select"),
                    icon: <IconSelect className="icon" />,
                    handler: handleSelect.bind(null, mid)
                  },
                  canDelete && {
                    title: t("action.remove"),
                    danger: true,
                    icon: <IconDelete className="icon" />,
                    handler: toggleDeleteModal
                  }
                ].filter(Boolean) as Item[]
              }
            />
          }
        >
          <li className={cmdClass}>
            <Tooltip placement="top" tip={t("more")}>
              <IconMore className="w-5 h-5 fill-fg-subtle" />
            </Tooltip>
          </li>
        </Tippy>
      </ul>
      {PinModal}
      {ForwardModal}
      {DeleteModal}
    </>
  );
};
export default Commands;
