import { forwardRef, useEffect, useState } from "react";
import { Emoji, EmojiDropdownMenuOptions, useEmojiDropdownMenuState } from "@udecode/plate-emoji";
import { Plate } from "@udecode/plate-common";
import clsx from "clsx";

import IconSmile from "@/assets/icons/add.emoji.svg";
import { useRecentPicks } from "@/hooks/useRecentPicks";
import { EmojiTabbedPicker } from "./emoji-tabbed-picker";
import { StickerPicker } from "./sticker-picker";

type ButtonProps = {
  open: boolean;
  onToggle: () => void;
};

export const EmojiInputButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ open, onToggle }, ref) => {
    return (
      <button
        ref={ref}
        tabIndex={-1}
        onMouseDown={(e) => e.preventDefault()}
        className={clsx(
          "shrink-0 w-8 h-8 flex-center rounded-full transition-colors",
          open
            ? "text-accent bg-accent/10"
            : "text-fg-subtle hover:text-fg-primary hover:bg-bg-elevated"
        )}
        onClick={onToggle}
      >
        <IconSmile className="w-5 h-5 [&_path]:fill-current" />
      </button>
    );
  }
);
EmojiInputButton.displayName = "EmojiInputButton";

type Mode = "emoji" | "sticker";

type PanelProps = {
  options?: EmojiDropdownMenuOptions;
  onSelectEmoji?: (emoji: Emoji) => void;
  onSelectSticker?: (url: string) => void;
};

type EmojiPanelInnerProps = Pick<PanelProps, "options" | "onSelectEmoji"> & {
  recents: string[];
  pushRecent: (id: string) => void;
};

function EmojiPanelInner({ options, onSelectEmoji, recents, pushRecent }: EmojiPanelInnerProps) {
  const { setIsOpen, emojiPickerState } = useEmojiDropdownMenuState(options);
  useEffect(() => {
    setIsOpen(true);
    return () => setIsOpen(false);
  }, []);
  const handleSelect = (emoji: Emoji) => {
    if (emoji?.id) pushRecent(emoji.id);
    onSelectEmoji?.(emoji);
  };
  return (
    <EmojiTabbedPicker
      {...emojiPickerState}
      onSelectEmoji={handleSelect}
      recents={recents}
    />
  );
}

export const EmojiInputPanel = forwardRef<HTMLDivElement, PanelProps>(
  ({ options, onSelectEmoji, onSelectSticker }, ref) => {
    const [mode, setMode] = useState<Mode>("sticker");
    const [emojiRecents, pushEmojiRecent] = useRecentPicks<string>(
      "recent_emoji",
      32,
      (id) => id
    );

    return (
      <div
        ref={ref}
        className="w-full border-t border-border-subtle bg-bg-elevated overflow-hidden flex flex-col"
        style={{ height: "35vh" }}
      >
        {/* Top-level mode switch */}
        <div className="flex items-center gap-1 px-2 pt-2 pb-1 shrink-0">
          <button
            type="button"
            tabIndex={-1}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setMode("sticker")}
            className={clsx(
              "px-3 py-1 rounded-md text-sm font-medium transition-colors",
              mode === "sticker"
                ? "bg-bg-surface text-fg-primary"
                : "text-fg-subtle hover:text-fg-primary"
            )}
          >
            貼圖
          </button>
          <button
            type="button"
            tabIndex={-1}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setMode("emoji")}
            className={clsx(
              "px-3 py-1 rounded-md text-sm font-medium transition-colors",
              mode === "emoji"
                ? "bg-bg-surface text-fg-primary"
                : "text-fg-subtle hover:text-fg-primary"
            )}
          >
            表情
          </button>
        </div>

        {/* Active panel */}
        <div className="flex-1 min-h-0">
          {mode === "emoji" ? (
            <Plate key="emoji_panel">
              <EmojiPanelInner
                options={options}
                onSelectEmoji={onSelectEmoji}
                recents={emojiRecents}
                pushRecent={pushEmojiRecent}
              />
            </Plate>
          ) : (
            <StickerPicker
              onSelectSticker={(url) => {
                onSelectSticker?.(url);
              }}
            />
          )}
        </div>
      </div>
    );
  }
);
EmojiInputPanel.displayName = "EmojiInputPanel";
