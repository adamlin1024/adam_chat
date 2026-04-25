import { FC, useEffect } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

import { useLazyClearAllFilesQuery, useLazyClearAllMessagesQuery } from "@/app/services/server";
import Modal from "@/components/Modal";
import Button from "@/components/styled/Button";
import StyledModal from "@/components/styled/Modal";
import { VisibleModalType } from "./index";

interface Props {
  context: VisibleModalType;
  title: string;
  desc: string;
  closeModal: () => void;
}

const ClearConfirmModal: FC<Props> = ({ context, title, desc, closeModal }) => {
  const { t } = useTranslation();
  const [
    clearFiles,
    { isLoading: filesClearing, isSuccess: clearFilesSuccess, isError: filesError, error: filesErr }
  ] = useLazyClearAllFilesQuery();
  const [
    clearMessages,
    { isLoading: msgClearing, isSuccess: clearMsgSuccess, isError: msgError, error: msgErr }
  ] = useLazyClearAllMessagesQuery();

  const handleClear = () => {
    switch (context) {
      case "chat":
        clearMessages();
        break;
      case "files":
        clearFiles();
        break;
      default:
        break;
    }
  };

  const clearSuccess = clearFilesSuccess || clearMsgSuccess;
  useEffect(() => {
    if (clearSuccess) {
      toast.success(t("tip.clear_success", { ns: "common" }));
      closeModal();
    }
  }, [clearSuccess]);

  const hasError = filesError || msgError;
  const errMsg =
    (filesErr as { data?: { msg?: string } } | undefined)?.data?.msg ??
    (msgErr as { data?: { msg?: string } } | undefined)?.data?.msg ??
    "";
  useEffect(() => {
    if (hasError) {
      toast.error(errMsg || t("tip.failed", { ns: "common", defaultValue: "操作失敗" }));
    }
  }, [hasError]);

  const clearing = msgClearing || filesClearing;
  return (
    <Modal id="modal-modal">
      <StyledModal
        title={title}
        description={desc}
        buttons={
          <>
            <Button className="cancel" onClick={closeModal} disabled={clearing}>
              {t("action.cancel")}
            </Button>
            <Button onClick={handleClear} className="danger" disabled={clearing}>
              {clearing ? t("tip.processing", { defaultValue: "處理中…" }) : t("action.remove")}
            </Button>
          </>
        }
      />
    </Modal>
  );
};

export default ClearConfirmModal;
