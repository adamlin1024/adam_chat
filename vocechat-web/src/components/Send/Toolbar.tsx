import { forwardRef } from "react";
import clsx from "clsx";

import ExitFullscreenIcon from "@/assets/icons/fullscreen.exit.svg";
import FullscreenIcon from "@/assets/icons/fullscreen.svg";
import SendIcon from "@/assets/icons/send.svg";
import Tooltip from "../Tooltip";

type Props = {
  sendMessages: () => void;
  toggleMarkdownFullscreen: () => void;
  fullscreen: boolean;
  mode: "markdown" | "text";
  sendVisible: boolean;
};

const Toolbar = forwardRef<HTMLDivElement, Props>(({
  sendMessages,
  sendVisible,
  toggleMarkdownFullscreen,
  fullscreen,
  mode,
}, ref) => {
  const isMarkdown = mode == "markdown";
  return (
    <div ref={ref} className="flex items-center gap-1 shrink-0 ml-1">
      {isMarkdown &&
        (fullscreen ? (
          <Tooltip placement="top" tip="Exit Fullscreen">
            <ExitFullscreenIcon
              onClick={toggleMarkdownFullscreen}
              className="w-4 h-4 cursor-pointer fill-fg-subtle hover:fill-fg-secondary transition-colors"
            />
          </Tooltip>
        ) : (
          <Tooltip placement="top" tip="Fullscreen">
            <FullscreenIcon
              onClick={toggleMarkdownFullscreen}
              className="w-4 h-4 cursor-pointer fill-fg-subtle hover:fill-fg-secondary transition-colors"
            />
          </Tooltip>
        ))}
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
