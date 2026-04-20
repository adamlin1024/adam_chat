import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { shallowEqual } from "react-redux";

import IconAdd from "@/assets/icons/add.person.svg";
import IconBlock from "@/assets/icons/block.svg";
import { useUpdateContactStatusMutation } from "../../../app/services/user";
import { useAppSelector } from "../../../app/store";
import { ContactAction } from "../../../types/user";

type Props = {
  uid: number;
};

const AddContactTip = (props: Props) => {
  const { t } = useTranslation("chat");
  const { t: tMember } = useTranslation("member");
  const [updateContactStatus, { error: addContactError }] = useUpdateContactStatusMutation();
  const enableContact = useAppSelector(
    (store) => store.server.contact_verification_enable,
    shallowEqual
  );
  const isAdmin = useAppSelector((store) => store.authData.user?.is_admin, shallowEqual);
  const addFriendEnable = useAppSelector(
    (store) => store.server.add_friend_enable ?? true,
    shallowEqual
  );
  const targetUser = useAppSelector((store) => store.users.byId[props.uid], shallowEqual);

  useEffect(() => {
    if (!addContactError) return;
    const err = addContactError as any;
    const httpStatus: number = err?.originalStatus ?? err?.status;
    const errData: string = typeof err?.data === "string" ? err.data : "";
    toast.error(
      httpStatus === 403 && errData.includes("disabled by the administrator")
        ? tMember("add_friend_disabled")
        : tMember("tip.update_failed", { ns: "common", defaultValue: "Operation failed" })
    );
  }, [addContactError]);

  const handleContactStatus = (action: ContactAction) => {
    updateContactStatus({ target_uid: props.uid, action });
  };
  if (!targetUser || !enableContact) return null;
  if (targetUser.status == "added") return null;
  const blocked = targetUser.status == "blocked";
  return (
    <div className="px-6 py-2.5 flex items-center justify-between border-b border-border-subtle bg-bg-canvas">
      <span className="text-[11px] text-fg-muted tracking-[-0.005em]">
        {blocked ? t("contact_block_tip") : t("contact_tip")}
      </span>
      <ul className="flex gap-2">
        {!blocked && (isAdmin || addFriendEnable) && (
          <li
            className="cursor-pointer flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-medium text-accent border border-border bg-bg-surface hover:border-border-strong transition-colors duration-[120ms]"
            onClick={handleContactStatus.bind(null, "add")}
          >
            <IconAdd className="w-3.5 h-3.5 stroke-accent fill-none" />
            <span>{t("add_contact")}</span>
          </li>
        )}
        <li
          className="cursor-pointer flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-medium text-fg-secondary border border-border bg-bg-surface hover:border-border-strong transition-colors duration-[120ms]"
          onClick={blocked ? handleContactStatus.bind(null, "unblock") : handleContactStatus.bind(null, "block")}
        >
          <IconBlock className="w-3.5 h-3.5 stroke-current fill-none" />
          <span>{blocked ? t("unblock") : t("block")}</span>
        </li>
      </ul>
    </div>
  );
};

export default AddContactTip;
