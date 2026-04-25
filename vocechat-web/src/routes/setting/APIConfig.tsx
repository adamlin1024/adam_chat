import { useEffect } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import Tippy from "@tippyjs/react";
import { hideAll } from "tippy.js";

import {
  useGetThirdPartySecretQuery,
  useUpdateThirdPartySecretMutation
} from "@/app/services/server";
import { LoginConfig } from "@/types/server";
import Button from "@/components/styled/Button";
import Input from "@/components/styled/Input";
import Toggle from "@/components/styled/Toggle";
import useConfig from "@/hooks/useConfig";

export default function APIConfig() {
  const { t } = useTranslation("setting");
  const { t: ct } = useTranslation();
  const { updateConfig, values } = useConfig("login");
  const { data } = useGetThirdPartySecretQuery();
  const [updateSecret, { data: updatedSecret, isSuccess, isLoading }] =
    useUpdateThirdPartySecretMutation();

  useEffect(() => {
    if (isSuccess) {
      hideAll();
      toast.success(ct("tip.update"));
    }
  }, [isSuccess]);
  const handleToggle = (val: { third_party: boolean }) => {
    updateConfig({ ...values, ...val });
  };
  const thirdParty = (values as LoginConfig)?.third_party;

  return (
    <div className="max-w-[500px] flex flex-col gap-4 items-start">
      <Toggle
        onClick={handleToggle.bind(null, { third_party: !thirdParty })}
        checked={thirdParty}
      />
      <div className="w-full flex flex-col items-start gap-2">
        <label htmlFor="secret" className="text-sm text-fg-primary">
          {" "}
          {t("third_app.key")}:
        </label>
        <Input disabled={!thirdParty} type="password" id="secret" value={updatedSecret || data} />
      </div>
      <Tippy
        interactive
        placement="right-start"
        trigger="click"
        content={
          <div className="p-3 rounded-lg border border-danger border-solid flex flex-col gap-3 w-[250px] bg-bg-elevated">
            <div className="text-danger text-xs">{t("third_app.update_tip")}</div>
            <div className="flex justify-end gap-3 w-full">
              <Button onClick={() => hideAll()} className="cancel mini">
                {ct("action.cancel")}
              </Button>
              <Button disabled={isLoading} className="mini danger" onClick={() => updateSecret()}>
                {ct("action.yes")}
              </Button>
            </div>
          </div>
        }
      >
        <Button disabled={!thirdParty}> {t("third_app.update")}</Button>
      </Tippy>
      <div className="text-xs text-danger">
        {t("third_app.key_tip")}
        <a
          className="text-accent font-bold"
          href="https://doc.voce.chat/login-with-other-account"
          target="_blank"
          rel="noopener noreferrer"
        >
          🔗 {t("third_app.how_to")}
        </a>
      </div>
    </div>
  );
}
