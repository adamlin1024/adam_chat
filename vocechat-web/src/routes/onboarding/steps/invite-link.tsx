import { useTranslation } from "react-i18next";
import { useWizard } from "react-use-wizard";

import StyledButton from "@/components/styled/Button";
import StyledInput from "@/components/styled/Input";
import useInviteLink from "@/hooks/useInviteLink";
import UpdateFrontendURL from "./UpdateFrontendURL";

export default function InviteLink() {
  const { t } = useTranslation("welcome", { keyPrefix: "onboarding" });
  const { t: ct } = useTranslation();
  const { nextStep } = useWizard();
  const { link, linkCopied, copyLink, generateNewLink } = useInviteLink();

  return (
    <div className="px-2 h-full flex-center flex-col relative text-fg-primary">
      <span className="text-2xl mb-2 font-bold">{t("invite_title")}</span>
      <span className="text-sm mb-10 text-fg-subtle">{t("last_tip")}</span>
      <span className="text-sm text-fg-muted mb-2 font-semibold">{t("last_desc")}</span>
      <div className="w-full md:w-[400px] rounded shadow-md flex border border-solid border-border-subtle">
        <StyledInput
          className="large !border-none !shadow-none"
          readOnly
          placeholder={t("placeholder_generating")}
          value={link}
        />
        <StyledButton
          onClick={copyLink}
          className="ghost small border_less !px-2 md:hover:!text-accent-hover"
        >
          {linkCopied ? ct("action.copied") : ct("action.copy")}
        </StyledButton>
      </div>
      <StyledButton className="w-32 h-11 mt-6" onClick={nextStep}>
        {t("done")}
      </StyledButton>
      <UpdateFrontendURL refreshInviteLink={generateNewLink} />
    </div>
  );
}
