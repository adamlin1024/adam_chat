import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useWizard, Wizard } from "react-use-wizard";
import clsx from "clsx";

import steps from "./steps";
import AdminAccount from "./steps/admin-account";
import DonePage from "./steps/done-page";
import InviteLink from "./steps/invite-link";
import ServerName from "./steps/server-name";
import WelcomePage from "./steps/welcome-page";
import WhoCanSignUp from "./steps/who-can-sign-up";
import SelectLanguage from "../../components/Language";

const Navigator = () => {
  const { activeStep, goToStep } = useWizard();
  const canJumpTo = steps[activeStep]?.canJumpTo || [];
  console.log("active step", activeStep);

  return (
    <div className="hidden md:flex absolute top-5 w-full justify-center gap-2 z-10">
      {steps.map((stepToRender, indexToRender) => {
        const clickable = canJumpTo.includes(stepToRender.name);
        const itemClass = clsx(
          `text-sm text-fg-subtle`,
          clickable && "cursor-pointer md:hover:text-fg-muted",
          indexToRender === activeStep && "font-bold text-fg-primary",
          indexToRender >= activeStep && "text-fg-secondary"
        );
        const nodeCls = `${itemClass}`;
        return (
          <React.Fragment key={indexToRender}>
            <span
              className={nodeCls}
              onClick={() => {
                if (clickable) {
                  goToStep(indexToRender);
                }
              }}
            >
              {stepToRender.label}
            </span>
            {indexToRender !== steps.length - 1 && <span className={nodeCls}>→</span>}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default function OnboardingPage() {
  const { t } = useTranslation("welcome");
  const [serverName, setServerName] = useState("");
  return (
    <>
      <title>{t("onboarding.title") || ""}</title>
      <div className="h-screen bg-bg-app overflow-y-auto">
        <Wizard header={<Navigator />}>
          <WelcomePage />
          <ServerName serverName={serverName} setServerName={setServerName} />
          <AdminAccount serverName={serverName} />
          <WhoCanSignUp />
          {/* lazy call invite link API  */}
          <InviteLink />
          <DonePage serverName={serverName} />
        </Wizard>
      </div>
      <SelectLanguage />
    </>
  );
}
