import { FC, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useKey } from "rooks";

import { updateSelectMessages } from "@/app/slices/ui";
import { useAppDispatch, useAppSelector } from "@/app/store";
import { ChatContext } from "@/types/common";
import DeleteMessageConfirmModal from "@/components/DeleteMessageConfirm";
import ForwardModal from "@/components/ForwardModal";
import useDeleteMessage from "@/hooks/useDeleteMessage";
import useFavMessage from "@/hooks/useFavMessage";
import IconBookmark from "@/assets/icons/bookmark.svg";
import IconClose from "@/assets/icons/close.circle.svg";
import IconDelete from "@/assets/icons/delete.svg";
import IconForward from "@/assets/icons/forward.svg";
import { shallowEqual } from "react-redux";

type Props = {
  context: ChatContext;
  id: number;
};
const Operations: FC<Props> = ({ context, id }) => {
  const { t } = useTranslation();
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const { canDelete } = useDeleteMessage();
  const { addFavorite } = useFavMessage({});
  const mids = useAppSelector((store) => store.ui.selectMessages[`${context}_${id}`], shallowEqual);
  const [forwardModalVisible, setForwardModalVisible] = useState(false);
  const dispatch = useAppDispatch();

  const count = mids?.length ?? 0;

  const handleClose = () => {
    dispatch(updateSelectMessages({ context, id, operation: "reset" }));
  };

  const handleFav = async () => {
    const added = await addFavorite(mids);
    if (added) {
      dispatch(updateSelectMessages({ context, id, operation: "reset" }));
      toast.success(t("tip.msgs_saved", { ns: "common" }));
    } else {
      toast.error(t("tip.operation_failed", { ns: "common" }));
    }
  };

  const toggleDeleteModal = (isSuccess = false) => {
    setDeleteModalVisible((prev) => !prev);
    if (isSuccess) {
      dispatch(updateSelectMessages({ context, id, operation: "reset" }));
      toast.success(t("tip.msgs_deleted", { ns: "common" }));
    }
  };

  const toggleForwardModal = () => {
    setForwardModalVisible((prev) => !prev);
  };

  useKey("Escape", () => {
    dispatch(updateSelectMessages({ context, id, operation: "reset" }));
  });
  const canDel = canDelete(mids);
  const disabled = count === 0;

  return (
    <>
      <div className="relative w-full bg-bg-elevated border-t border-border-subtle pb-safe">
        <div className="flex items-center justify-between px-3 py-2.5">
          <button
            type="button"
            onClick={handleClose}
            className="ts-meta text-fg-secondary px-2 py-1 hover:text-fg-primary transition-colors"
          >
            {t("action.cancel", { ns: "common" })}
          </button>
          <span className="ts-meta text-fg-primary font-semibold">
            {count > 0 ? t("selected_count", { ns: "chat", count, defaultValue: `已選 ${count} 則` }) : t("select_msgs", { ns: "chat", defaultValue: "選擇訊息" })}
          </span>
          <span className="w-12" />
        </div>
        <div className="grid grid-cols-3 gap-1 px-3 pb-2">
          <button
            type="button"
            onClick={toggleForwardModal}
            disabled={disabled}
            className="flex flex-col items-center gap-1 py-2.5 rounded-lg active:bg-bg-hover hover:bg-bg-hover disabled:opacity-40 disabled:active:bg-transparent transition-colors"
          >
            <IconForward className="w-6 h-6 fill-fg-body" />
            <span className="ts-mini text-fg-secondary">{t("action.forward", { ns: "common" })}</span>
          </button>
          <button
            type="button"
            onClick={handleFav}
            disabled={disabled}
            className="flex flex-col items-center gap-1 py-2.5 rounded-lg active:bg-bg-hover hover:bg-bg-hover disabled:opacity-40 disabled:active:bg-transparent transition-colors"
          >
            <IconBookmark className="w-6 h-6 fill-fg-body" />
            <span className="ts-mini text-fg-secondary">{t("action.add_to_fav", { ns: "common" })}</span>
          </button>
          <button
            type="button"
            onClick={toggleDeleteModal.bind(null, false)}
            disabled={disabled || !canDel}
            className="flex flex-col items-center gap-1 py-2.5 rounded-lg active:bg-bg-hover hover:bg-bg-hover disabled:opacity-40 disabled:active:bg-transparent transition-colors"
          >
            <IconDelete className="w-6 h-6 fill-danger" />
            <span className="ts-mini text-danger">{t("action.remove", { ns: "common" })}</span>
          </button>
        </div>
      </div>
      {forwardModalVisible && <ForwardModal mids={mids} closeModal={toggleForwardModal} />}
      {deleteModalVisible && (
        <DeleteMessageConfirmModal mids={mids} closeModal={toggleDeleteModal} />
      )}
    </>
  );
};
export default Operations;
