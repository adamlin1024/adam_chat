import { FC, MouseEvent } from "react";
import { useTranslation } from "react-i18next";

interface Props {
  saveHandler: (e: MouseEvent) => void;
  resetHandler: (e: MouseEvent) => void;
}

const SaveTip: FC<Props> = ({ saveHandler, resetHandler }) => {
  const { t } = useTranslation("setting");
  return (
    <div className="z-[999] fixed bottom-4 left-4 right-4 mx-auto max-w-lg
      flex items-center justify-between gap-3 px-4 py-2.5
      bg-bg-elevated border border-border rounded-xl shadow-overlay">
      <span className="text-sm font-medium text-fg-secondary">{t("save_tip")}</span>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={resetHandler}
          className="px-3 py-1.5 rounded-md ts-meta font-mono font-bold text-fg-secondary border border-border hover:border-border-strong transition-colors"
        >
          {t("reset")}
        </button>
        <button
          onClick={saveHandler}
          className="px-3 py-1.5 rounded-md ts-meta font-mono font-bold bg-accent text-accent-on hover:opacity-90 transition-opacity"
        >
          {t("save_change")}
        </button>
      </div>
    </div>
  );
};

export default SaveTip;
