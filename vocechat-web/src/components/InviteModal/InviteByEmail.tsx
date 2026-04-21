import { ChangeEvent, FC, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

import { useSendLoginMagicLinkMutation } from "@/app/services/auth";
import useInviteLink from "@/hooks/useInviteLink";
import InviteLink from "../InviteLink";
import Button from "../styled/Button";

interface Props {
  cid?: number;
}

const InviteByEmail: FC<Props> = ({ cid }) => {
  const { t } = useTranslation("chat");
  const { t: ct } = useTranslation();
  const [email, setEmail] = useState("");
  const formRef = useRef<HTMLFormElement | null>(null);
  const [sendMagicLinkByEmail, { isSuccess, isLoading }] = useSendLoginMagicLinkMutation();
  const { enableSMTP } = useInviteLink(cid);
  useEffect(() => {
    if (isSuccess) {
      toast.success("Email Sent!");
    }
  }, [isSuccess]);

  const handleEmail = (evt: ChangeEvent<HTMLInputElement>) => {
    setEmail(evt.target.value);
  };
  const handleSendEmail = () => {
    if (formRef && formRef.current) {
      const formEle = formRef.current;
      if (!formEle.checkValidity()) {
        formEle.reportValidity();
      } else {
        sendMagicLinkByEmail(email);
      }
    }
  };

  return (
    <div className="pt-4">
      <div className="flex flex-col gap-4 mb-6">
        <label className="text-sm text-gray-400 dark:text-gray-100" htmlFor="">
          {t("invite_by_email")}
        </label>
        <div className="relative flex items-center">
          <form ref={formRef} action="/" className="w-full relative">
            <input
              required
              value={email}
              onChange={handleEmail}
              disabled={!enableSMTP}
              type="email"
              name="email"
              placeholder={enableSMTP ? "Enter Email" : t("enable_smtp")}
              className="w-full bg-bg-surface rounded-md px-3 py-2 pr-20 text-sm border border-border focus:border-border-strong outline-none text-fg-body placeholder:text-fg-disabled transition-colors disabled:opacity-50"
            />
            <Button
              disabled={!enableSMTP || !email || isLoading}
              className="send absolute right-1.5 top-1/2 -translate-y-1/2 !h-7 !text-xs !px-2.5"
              onClick={handleSendEmail}
            >
              {ct("action.send")}
            </Button>
          </form>
        </div>
      </div>
      <div className="flex flex-col gap-2 mb-3">
        <label className="text-sm text-gray-400 dark:text-gray-100" htmlFor="">
          {t("send_invite_link")}
        </label>
        <InviteLink context="channel" cid={cid} />
      </div>
    </div>
  );
};

export default InviteByEmail;
