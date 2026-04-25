import { useTranslation } from "react-i18next";
import { NavLink, useLocation } from "react-router-dom";
import Tippy from "@tippyjs/react";

import { useAppSelector } from "@/app/store";
import IconAdd from "@/assets/icons/add.svg";
import AddEntriesMenu from "./AddEntriesMenu";
import Tooltip from "./Tooltip";
import { shallowEqual } from "react-redux";

type Props = {
  readonly?: boolean;
};
export default function Server({ readonly = false }: Props) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const { name, description, logo } = useAppSelector((store) => store.server, shallowEqual);
  const userCount = useAppSelector((store) => store.users.ids.length, shallowEqual);
  // console.log("server info", server);
  if (readonly)
    return (
      <NavLink to={"/"} className="relative flex items-center justify-between gap-2 px-4 py-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8">
            <img
              alt={`${name} logo`}
              className="w-full h-full object-cover rounded-full"
              src={logo}
            />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-sm text-fg-primary" title={description}>
              {name}
            </h3>
            <span className="text-xs text-fg-muted">
              {userCount} {t("members")}
            </span>
          </div>
        </div>
      </NavLink>
    );

  return (
    <div className="relative flex items-center justify-between gap-2 px-4 py-3.5 border-b border-border-subtle">
      <NavLink to={`/setting/overview?f=${pathname}`}>
        <div className="flex flex-col gap-0.5">
          <span className="font-mono ts-xs tracking-[0.14em] uppercase text-fg-subtle">WORKSPACE</span>
          <h3 className="ts-msg font-semibold text-fg-primary truncate" title={description}>
            {name}
          </h3>
        </div>
      </NavLink>

      <Tooltip tip={t("more")} placement="bottom">
        <Tippy interactive placement="bottom-end" trigger="click" content={<AddEntriesMenu />}>
          <div className="flex h-[26px] w-[26px] items-center justify-center rounded-md border border-border text-fg-subtle hover:text-fg-secondary hover:border-border-strong transition-colors duration-200 cursor-pointer">
            <IconAdd className="fill-current" role="button" />
          </div>
        </Tippy>
      </Tooltip>
    </div>
  );
}
