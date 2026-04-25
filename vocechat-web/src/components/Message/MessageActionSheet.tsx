import { FC, ReactNode } from "react";

export interface SheetItem {
  title: string;
  icon: ReactNode;
  handler: () => void;
  danger?: boolean;
  keepOpen?: boolean;  // true → 點擊後不關閉 panel（如「表情」要切換到 reaction view）
}

type Props = {
  items: SheetItem[];
  hide: () => void;
};

/**
 * LINE 風格訊息長按浮動面板（Tippy content 用）。
 * 文字 / icon 跟著 msg-scale 縮放（用 ts-mini）。
 * Reaction view 改由 Message/index.tsx 直接 render 桌機 ReactionPicker，
 * 不再內部切換，避免 view 殘留 bug。
 */
const MessageActionPanel: FC<Props> = ({ items, hide }) => {
  return (
    <div className="bg-bg-elevated border border-border rounded-xl p-1.5 shadow-overlay min-w-[300px]">
      <div className="grid grid-cols-5 gap-0.5">
        {items.map((item) => (
          <button
            key={item.title}
            type="button"
            onClick={() => {
              item.handler();
              // keepOpen=true 的（如「表情」）由 handler 切換 view，不關閉 panel
              if (!item.keepOpen) hide();
            }}
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
    </div>
  );
};

export default MessageActionPanel;
