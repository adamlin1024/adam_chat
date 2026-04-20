import { FC } from "react";
import { useTranslation } from "react-i18next";

import { useAppSelector } from "@/app/store";
import CloseIcon from "@/assets/icons/close.svg";
import Modal from "../Modal";
import AddMembers from "./AddMembers";
import InviteByEmail from "./InviteByEmail";
import { shallowEqual } from "react-redux";

interface Props {
  type?: "server" | "channel";
  cid?: number;
  title?: string;
  closeModal: () => void;
}

const InviteModal: FC<Props> = ({ type = "server", cid, title = "", closeModal }) => {
  const { t } = useTranslation("chat");
  const channel = useAppSelector(
    (store) => (cid ? store.channels.byId[cid] : undefined),
    shallowEqual
  );
  const serverName = useAppSelector((store) => store.server.name, shallowEqual);
  const finalTitle = type == "server" ? serverName : `#${title || channel?.name}`;
  return (
    <Modal>
      <div className="flex flex-col bg-bg-elevated border border-border rounded-xl max-h-[85vh] overflow-y-scroll no-scrollbar md:min-w-[408px] relative shadow-overlay">
        <h2 className="z-50 px-5 py-4 bg-bg-elevated border-b border-border-subtle flex items-center justify-between font-bold text-[17px] tracking-tight text-fg-primary sticky top-0">
          {t("invite_title", { name: finalTitle })}
          <CloseIcon className="cursor-pointer fill-fg-subtle hover:fill-fg-secondary transition-colors" onClick={closeModal} />
        </h2>
        <div className="px-4 pb-4">
          {!channel?.is_public && <AddMembers cid={cid} closeModal={closeModal} />}
          <InviteByEmail cid={channel?.is_public ? undefined : cid} />
        </div>
      </div>
    </Modal>
  );
};

export default InviteModal;
