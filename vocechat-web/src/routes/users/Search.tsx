import { ChangeEvent, FC } from "react";
import { useTranslation } from "react-i18next";
import Tippy from "@tippyjs/react";
import clsx from "clsx";

import { useAppSelector } from "@/app/store";
import AddEntriesMenu from "@/components/AddEntriesMenu";
import Tooltip from "@/components/Tooltip";
import IconAdd from "@/assets/icons/add.svg";
import IconSearch from "@/assets/icons/search.svg";
import { shallowEqual } from "react-redux";

type Props = {
  type?: "users" | "members";
  input: string;
  openModal?: () => void;
  updateInput: (input: string) => void;
};
const Search: FC<Props> = ({ input, updateInput, openModal, type = "users" }) => {
  const enableContact = useAppSelector(
    (store) => store.server.contact_verification_enable,
    shallowEqual
  );
  const { t } = useTranslation();
  const handleInput = (evt: ChangeEvent<HTMLInputElement>) => {
    updateInput(evt.target.value);
  };
  const isMembers = type === "members";
  return (
    <div
      className={clsx(
        "w-full hidden md:flex relative items-center justify-between gap-2",
        isMembers
          ? "md:w-[512px] px-3 min-h-[40px] rounded-md bg-bg-surface border border-border mb-4 focus-within:border-border-strong"
          : "border-b border-border-subtle min-h-[52px] px-3"
      )}
    >
      <div className="flex items-center gap-2">
        <IconSearch className="fill-fg-subtle w-4 h-4 shrink-0" />
        <input
          value={input}
          placeholder={`${t("action.search_user")}...`}
          className="w-full font-mono text-[13px] text-fg-body placeholder:text-fg-disabled outline-none bg-transparent"
          onChange={handleInput}
        />
      </div>
      {!isMembers ? (
        enableContact ? (
          <IconAdd onClick={openModal} role="button" className="fill-fg-subtle hover:fill-fg-secondary cursor-pointer" />
        ) : (
          <Tooltip tip={t("more")} placement="bottom">
            <Tippy interactive placement="bottom-end" trigger="click" content={<AddEntriesMenu />}>
              <IconAdd role="button" className="fill-fg-subtle hover:fill-fg-secondary cursor-pointer" />
            </Tippy>
          </Tooltip>
        )
      ) : null}
    </div>
  );
};
export default Search;
