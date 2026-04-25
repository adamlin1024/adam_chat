import { FC, ReactNode, useState } from "react";
import { Emojis } from "@/app/config";
import Emoji from "../ReactionItem";

export interface SheetItem {
  title: string;
  icon: ReactNode;
  handler: () => void;  // 一般 action：點完後 panel 關閉
  danger?: boolean;
  isReact?: boolean;    // 標記為「反應」入口 → 切換 reaction view，不關閉
}

type Props = {
  items: SheetItem[];
  hide: () => void;
  onReact?: (emoji: string) => void;  // 點 emoji 後觸發
};

/**
 * LINE 風格訊息長按浮動面板（Tippy content 用）。
 * 兩個 view：action grid + reaction grid（內部切換）。
 * 文字 / icon 會跟著 msg-scale 縮放（用 ts-meta / ts-mini 等）。
 */
const MessageActionPanel: FC<Props> = ({ items, hide, onReact }) => {
  const [view, setView] = useState<"actions" | "reactions">("actions");

  const handleItem = (item: SheetItem) => {
    if (item.isReact) {
      setView("reactions");
      return;
    }
    item.handler();
    hide();
  };

  const handleEmoji = (emoji: string) => {
    onReact?.(emoji);
    hide();
  };

  return (
    <div className="bg-bg-elevated border border-border rounded-xl p-1.5 shadow-overlay min-w-[300px]">
      {view === "actions" ? (
        <div className="grid grid-cols-5 gap-0.5">
          {items.map((item) => (
            <button
              key={item.title}
              type="button"
              onClick={() => handleItem(item)}
              className="flex flex-col items-center gap-1.5 px-1 py-2.5 rounded-lg active:bg-bg-hover hover:bg-bg-hover transition-colors min-h-[64px]"
            >
              <span className={`flex-center w-6 h-6 ${item.danger ? "text-danger" : "text-fg-body"}`}>
                {item.icon}
              </span>
              <span
                className={`ts-mini leading-tight whitespace-nowrap ${
                  item.danger ? "text-danger" : "text-fg-secondary"
                }`}
              >
                {item.title}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-1 p-1">
          {Emojis.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleEmoji(emoji)}
              className="flex-center cursor-pointer rounded-lg p-3 active:bg-bg-hover hover:bg-bg-hover transition-colors"
            >
              <Emoji native={emoji as any} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MessageActionPanel;
