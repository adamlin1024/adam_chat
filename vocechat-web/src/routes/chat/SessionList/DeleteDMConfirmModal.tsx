import { FC } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useMatch } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { removeUserSession } from "@/app/slices/message.user";
import Modal from "@/components/Modal";
import Button from "@/components/styled/Button";
import StyledModal from "@/components/styled/Modal";

interface Props {
  id: number;
  closeModal: () => void;
}

const DeleteDMConfirmModal: FC<Props> = ({ id, closeModal }) => {
  const { t: ct } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isCurrentPath = useMatch(`/chat/dm/${id}`);

  const handleDelete = () => {
    dispatch(removeUserSession(id));
    if (isCurrentPath) navigate("/chat");
    closeModal();
  };

  if (!id) return null;
  return (
    <Modal id="modal-modal">
      <StyledModal
        compact
        title="移除對話"
        description="確定要移除這個對話嗎？對方的訊息記錄不受影響。"
        buttons={
          <>
            <Button onClick={closeModal} className="cancel">
              {ct("action.cancel")}
            </Button>
            <Button onClick={handleDelete} className="danger">
              {ct("action.remove")}
            </Button>
          </>
        }
      />
    </Modal>
  );
};

export default DeleteDMConfirmModal;
