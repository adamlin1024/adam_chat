import { forwardRef, useEffect } from "react";
import { Emoji, EmojiDropdownMenuOptions, useEmojiDropdownMenuState } from "@udecode/plate-emoji";
import { Plate } from "@udecode/plate-common";
import clsx from "clsx";

import IconSmile from "@/assets/icons/add.emoji.svg";
import { EmojiTabbedPicker } from "./emoji-tabbed-picker";

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

type PanelProps = {
  options?: EmojiDropdownMenuOptions;
  onSelectEmoji?: (emoji: Emoji) => void;
};

function PanelInner({ options, onSelectEmoji }: PanelProps) {
  const { setIsOpen, emojiPickerState } = useEmojiDropdownMenuState(options);
  useEffect(() => {
    setIsOpen(true);
    return () => setIsOpen(false);
  }, []);
  const picker = onSelectEmoji
    ? { ...emojiPickerState, onSelectEmoji }
    : emojiPickerState;
  return <EmojiTabbedPicker {...picker} />;
}

export const EmojiInputPanel = forwardRef<HTMLDivElement, PanelProps>((props, ref) => {
  return (
    <div
      ref={ref}
      className="w-full border-t border-border-subtle bg-bg-elevated overflow-hidden"
      style={{ height: "30vh" }}
    >
      <Plate key="emoji_panel">
        <PanelInner {...props} />
      </Plate>
    </div>
  );
});
EmojiInputPanel.displayName = "EmojiInputPanel";
