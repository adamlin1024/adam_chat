import { FC } from "react";
import { useTranslation } from "react-i18next";
import { GroupAnnouncement } from "@/types/sse";
import IconClose from "@/assets/icons/close.svg";

interface Props {
  announcement: GroupAnnouncement;
  onExpand: () => void;
  onDismiss: () => void;
}

const AnnouncementBanner: FC<Props> = ({ announcement, onExpand, onDismiss }) => {
  const { t } = useTranslation("chat");
  const firstLine = announcement.content.split("\n")[0].trim();
  const truncatedContent = firstLine.length > 100 ? `${firstLine.slice(0, 100)}...` : firstLine;

  return (
    <div className="w-full bg-idle/10  border-b border-idle/30  px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2">
          <span className="text-idle font-semibold text-sm">
            📢 {t("announcement")}:
          </span>
          <button
            onClick={onExpand}
            className="flex-1 text-left text-idle  text-sm hover:underline truncate"
          >
            {truncatedContent}
          </button>
        </div>
        <button
          onClick={onDismiss}
          className="shrink-0 p-1 hover:bg-idle/20 rounded transition-colors"
          aria-label={t("dismiss_announcement")}
        >
          <IconClose className="w-4 h-4 text-idle " />
        </button>
      </div>
    </div>
  );
};

export default AnnouncementBanner;
