import { ReactElement } from "react";
import { Trans, useTranslation } from "react-i18next";

import { useAppSelector } from "../app/store";
import { compareVersion } from "../utils";
import { shallowEqual } from "react-redux";

type Props = {
  empty?: boolean;
  version: string;
  children: ReactElement;
};

const ServerVersionChecker = ({ empty = false, version, children }: Props) => {
  const { t } = useTranslation();
  const currentVersion = useAppSelector((store) => store.server.version, shallowEqual);
  if (!currentVersion) return null;
  const res = compareVersion(currentVersion, version);
  if (res < 0)
    return empty ? null : (
      <div className="flex flex-col gap-2 items-start border border-solid border-danger p-3 rounded-lg w-fit">
        <span className="text-fg-secondary text-sm">
          <Trans i18nKey={"server_update.version_needed"}>
            <strong className="font-bold">{{ version }}</strong>
          </Trans>
        </span>
        <span className="text-fg-secondary text-sm">
          <Trans i18nKey={"server_update.current_version"}>
            <strong className="font-bold">{{ version: currentVersion }}</strong>
          </Trans>
        </span>
        <span className="text-fg-secondary text-sm">{t("server_update.update_tip")}</span>
        <a
          className="text-accent underline"
          href="https://doc.voce.chat/install/docker"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t("server_update.howto")} 📖{" "}
        </a>
      </div>
    );
  return children;
};

export default ServerVersionChecker;
