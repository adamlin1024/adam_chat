// import React from "react";
import { useTranslation } from "react-i18next";
import Modal from "../Modal";
import Input from "../styled/Input";
import StyledButton from "../styled/Button";
import useUserOperation from "@/hooks/useUserOperation";
import { ChangeEvent, useState } from "react";
import toast from "react-hot-toast";

type Props = {
  uid?: number;
  onClose: () => void;
};

const UpdatePassword = ({ uid, onClose }: Props) => {
  const { t } = useTranslation();
  const [pwd, setPwd] = useState("");
  const { updatePassword } = useUserOperation({ uid });
  const handleUpdate = () => {
    if (pwd.length < 6) {
      toast.error(t("tip.min_length_6", { ns: "common" }));
      return;
    }
    updatePassword(pwd);
    setPwd("");
  };
  const handleChange = (evt: ChangeEvent<HTMLInputElement>) => {
    setPwd(evt.target.value);
  };
  if (!uid) return null;
  return (
    <Modal>
      <div className="flex flex-col gap-3 py-4 px-6 rounded-md bg-bg-app relative">
        <label htmlFor="pwd" className="text-fg-body">
          Password:
        </label>
        <Input id="pwd" value={pwd} onChange={handleChange} placeholder={t("placeholder.new_password")} />
        <div className="flex items-center gap-2">
          <StyledButton disabled={!pwd} className="small" onClick={handleUpdate}>
            {t("action.update")}
          </StyledButton>
          <StyledButton className="small cancel" onClick={onClose}>
            {t("action.close")}
          </StyledButton>
        </div>
      </div>
    </Modal>
  );
};

export default UpdatePassword;
