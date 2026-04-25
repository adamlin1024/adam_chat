import { FC } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

import Tooltip from "@/components/Tooltip";
import IconSetting from "@/assets/icons/setting.svg";

type Props = {};
const Menu: FC<Props> = () => {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  return (
    <div className="mt-auto flex flex-col items-center gap-1 px-3 pb-3.5">
      <NavLink to={`/setting/overview?f=${pathname}`}>
        <Tooltip placement="right" tip={t("setting")}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg
                          text-fg-primary hover:text-fg-primary transition-colors duration-200">
            <IconSetting className="w-[18px] h-[18px] stroke-current fill-none" />
          </div>
        </Tooltip>
      </NavLink>
    </div>
  );
};
export default Menu;
