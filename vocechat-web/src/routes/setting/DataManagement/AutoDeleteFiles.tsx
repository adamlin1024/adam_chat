import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { shallowEqual } from "react-redux";

import { useGetSystemCommonQuery, useUpdateSystemCommonMutation } from "@/app/services/server";
import { useAppSelector } from "@/app/store";
import { MessageExpireMode } from "@/types/server";
import Modal from "@/components/Modal";
import SettingBlock from "@/components/SettingBlock";
import Button from "@/components/styled/Button";
import StyledModal from "@/components/styled/Modal";
import StyledRadio from "@/components/styled/Radio";

const AutoDeleteFiles = () => {
  const currStatus = useAppSelector(
    (store) => store.server.max_file_expiry_mode ?? "Off",
    shallowEqual
  );
  const { t } = useTranslation("setting", { keyPrefix: "data.auto_delete_file" });
  const { t: ct } = useTranslation();
  const { refetch } = useGetSystemCommonQuery();
  const [selected, setSelected] = useState<MessageExpireMode>(currStatus);
  const [updateSetting, { isSuccess, isLoading, isError, error }] =
    useUpdateSystemCommonMutation();

  // 成功後關掉 confirm modal、刷新 server 設定、跳 toast
  useEffect(() => {
    if (isSuccess) {
      refetch();
      toast.success(ct("tip.update"));
      setSelected(currStatus);
    }
  }, [isSuccess]);

  // 失敗時跳錯誤提示，並把 selected 還原（讓 modal 自然關掉）
  useEffect(() => {
    if (isError) {
      const msg = (error as { data?: { msg?: string } } | undefined)?.data?.msg;
      toast.error(msg || ct("tip.failed", { defaultValue: "更新失敗" }));
      setSelected(currStatus);
    }
  }, [isError]);

  // 跟著 redux 的 currStatus 更新本地 selected（其他 tab / 設備同步進來時）
  useEffect(() => {
    setSelected(currStatus);
  }, [currStatus]);

  const handleChange = (newVal: MessageExpireMode) => {
    setSelected(newVal);
  };
  const handleClose = () => {
    setSelected(currStatus);
  };
  const handleUpdate = () => {
    updateSetting({ max_file_expiry_mode: selected });
  };

  return (
    <>
      <SettingBlock title={t("title")} desc={t("desc")}>
        <StyledRadio
          options={[t("off"), t("day1"), t("day7"), t("day30"), t("day90"), t("day180")]}
          values={["Off", "Day1", "Day7", "Day30", "Day90", "Day180"]}
          value={currStatus}
          onChange={handleChange}
          disabled={isLoading}
        />
      </SettingBlock>
      {selected !== currStatus && (
        <Modal id="modal-modal">
          <StyledModal
            title={ct("action.confirm", { defaultValue: "確認更新" })}
            description={selected == "Off" ? "" : t("confirm_desc")}
            buttons={
              <>
                <Button className="cancel" onClick={handleClose} disabled={isLoading}>
                  {ct("action.cancel")}
                </Button>
                <Button onClick={handleUpdate} className="danger" disabled={isLoading}>
                  {isLoading
                    ? ct("tip.processing", { defaultValue: "處理中…" })
                    : ct("action.yes")}
                </Button>
              </>
            }
          />
        </Modal>
      )}
    </>
  );
};

export default AutoDeleteFiles;
