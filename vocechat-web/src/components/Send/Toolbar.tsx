import { forwardRef } from "react";
import clsx from "clsx";
import { useTranslation } from "react-i18next";

import ExitFullscreenIcon from "@/assets/icons/fullscreen.exit.svg";
import FullscreenIcon from "@/assets/icons/fullscreen.svg";
import SendIcon from "@/assets/icons/send.svg";
import CloseIcon from "@/assets/icons/close.svg";
import Tooltip from "../Tooltip";

type Props = {
  sendMessages: () => void;
  toggleMarkdownFullscreen: () => void;
  /** 從 markdown 模式切回 text 模式（拉掉編輯器） */
  toggleMode: () => void;
  fullscreen: boolean;
  mode: "markdown" | "text";
  sendVisible: boolean;
};

const Toolbar = forwardRef<HTMLDivElement, Props>(({
  sendMessages,
  sendVisible,
  toggleMarkdownFullscreen,
  toggleMode,
  fullscreen,
  mode,
}, ref) => {
  const { t } = useTranslation();
  const isMarkdown = mode == "markdown";

  // Markdown 模式：MarkdownEditor 內部已有自己的 Send 按鈕，這裡不重複放紙飛機。
  // 浮動定位在 .send 右上角（仿照設定 sheet 的 ✕ 位置）：放大 + 關閉
  if (isMarkdown) {
    return (
      <div
        ref={ref}
        className="absolute top-2 right-2 md:top-3 md:right-3 z-10 flex items-center gap-0.5"
      >
        <Tooltip placement="bottom" tip={fullscreen ? t("action.exit_fullscreen") : t("action.fullscreen")}>
          <button
            type="button"
            tabIndex={-1}
            onClick={toggleMarkdownFullscreen}
            onMouseDown={(e) => e.preventDefault()}
            className="w-7 h-7 flex-center rounded-md text-fg-subtle hover:text-fg-primary hover:bg-bg-hover transition-colors"
          >
            {fullscreen ? (
              <ExitFullscreenIcon className="w-4 h-4 fill-current" />
            ) : (
              <FullscreenIcon className="w-4 h-4 fill-current" />
            )}
          </button>
        </Tooltip>
        <Tooltip placement="bottom" tip={t("action.close")}>
          <button
            type="button"
            tabIndex={-1}
            onClick={toggleMode}
            onMouseDown={(e) => e.preventDefault()}
            className="w-7 h-7 flex-center rounded-md text-fg-subtle hover:text-fg-primary hover:bg-bg-hover transition-colors"
            aria-label={t("action.close") as string}
          >
            <CloseIcon className="w-4 h-4 fill-current" />
          </button>
        </Tooltip>
      </div>
    );
  }

  // Text 模式：保持原本的紙飛機 send 按鈕
  return (
    <div ref={ref} className="flex items-center gap-1 shrink-0 ml-1">
      <button
        tabIndex={-1}
        onClick={sendVisible ? sendMessages : undefined}
        onMouseDown={(e) => e.preventDefault()}
        className={clsx(
          "w-8 h-8 flex-center rounded-full transition-colors",
          sendVisible
            ? "text-accent hover:bg-accent/10 cursor-pointer"
            : "text-fg-disabled cursor-default"
        )}
      >
        <SendIcon className="w-5 h-5 fill-current" />
      </button>
    </div>
  );
});
Toolbar.displayName = "Toolbar";
export default Toolbar;
