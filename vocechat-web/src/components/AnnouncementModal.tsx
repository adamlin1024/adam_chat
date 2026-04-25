import { FC } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { GroupAnnouncement } from "@/types/sse";
import { useAppSelector } from "@/app/store";
import Modal from "./Modal";
import MarkdownRender from "./MarkdownRender";
import IconClose from "@/assets/icons/close.svg";
import { shallowEqual } from "react-redux";

interface Props {
  announcement: GroupAnnouncement;
  onClose: () => void;
  cid: number;
}

const AnnouncementModal: FC<Props> = ({ announcement, onClose, cid }) => {
  const { t } = useTranslation("chat");
  const { t: ct } = useTranslation();
  const navigate = useNavigate();
  const loginUser = useAppSelector((store) => store.authData.user, shallowEqual);
  const channel = useAppSelector((store) => store.channels.byId[cid], shallowEqual);
  const usersData = useAppSelector((store) => store.users.byId, shallowEqual);

  const canManage = loginUser?.is_admin || channel?.owner === loginUser?.uid;
  const creator = usersData[announcement.created_by];

  const handleEdit = () => {
    navigate(`/setting/channel/${cid}/announcement`);
    onClose();
  };

  return (
    <Modal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-app/50">
        <div className="bg-bg-elevated rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-xl font-semibold text-fg-primary">
              📢 {t("announcement")}
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-bg-surface rounded transition-colors"
              aria-label={ct("action.close")}
            >
              <IconClose className="w-5 h-5 text-fg-secondary" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="prose dark:prose-invert max-w-none">
              <MarkdownRender content={announcement.content} />
            </div>

            {/* Metadata */}
            <div className="mt-6 pt-4 border-t border-border text-sm text-fg-secondary">
              <div className="flex flex-col gap-1">
                {creator && (
                  <div>
                    <span className="font-semibold">{t("created_by")}:</span> {creator.name}
                  </div>
                )}
                <div>
                  <span className="font-semibold">{t("created_at")}:</span>{" "}
                  {dayjs(announcement.created_at).format("YYYY-MM-DD h:mm A")}
                </div>
                {announcement.updated_at !== announcement.created_at && (
                  <div>
                    <span className="font-semibold">{t("updated_at")}:</span>{" "}
                    {dayjs(announcement.updated_at).format("YYYY-MM-DD h:mm A")}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-4 border-t border-border">
            {canManage && (
              <button
                onClick={handleEdit}
                className="px-4 py-2 bg-accent hover:bg-accent-hover text-accent-on rounded transition-colors"
              >
                {t("edit_announcement")}
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-bg-surface hover:bg-bg-surface text-fg-primary rounded transition-colors"
            >
              {ct("action.close")}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default AnnouncementModal;
