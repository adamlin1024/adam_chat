import { useEffect } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";

import { useSendLoginMagicLinkMutation } from "@/app/services/auth";
import SentTip from "./SentTip";
import SelectLanguage from "../../components/Language";

export default function SendMagicLinkPage() {
  const { t } = useTranslation();
  const { email = "" } = useParams();
  const [sendMagicLink, { isSuccess, isLoading, error }] = useSendLoginMagicLinkMutation();
  const navigateTo = useNavigate();
  useEffect(() => {
    if (email) {
      sendMagicLink(email);
    }
  }, [email]);

  useEffect(() => {
    if (isSuccess) {
      toast.success(t("tip.send_email_success", { ns: "common" }));
    }
  }, [isSuccess]);

  useEffect(() => {
    if (error && "status" in error) {
      switch (error.status) {
        case "PARSING_ERROR":
          toast.error(error.data);
          break;
        case 401:
          toast.error(t("tip.username_or_password_incorrect", { ns: "common" }));
          break;
        case 404:
          toast.error(t("tip.account_not_exist", { ns: "common" }));
          break;
        default:
          toast.error(t("tip.something_error", { ns: "common" }));
          break;
      }
      return;
    }
  }, [error]);

  const handlePwdPath = () => {
    navigateTo("/login");
  };

  return (
    <>
      <SelectLanguage />
      <div className="flex-center h-screen bg-bg-elevated">
        <div className="py-8 px-10 shadow-md rounded-xl bg-bg-surface">
          {isSuccess ? (
            <SentTip email={email} handleBack={handlePwdPath} />
          ) : isLoading ? (
            <div className="">Sending...</div>
          ) : null}
        </div>
      </div>
    </>
  );
}
