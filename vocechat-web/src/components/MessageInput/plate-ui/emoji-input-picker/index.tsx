import { forwardRef, ReactNode, useEffect, useState } from "react";
import { Emoji, EmojiDropdownMenuOptions, useEmojiDropdownMenuState } from "@udecode/plate-emoji";
import { Plate } from "@udecode/plate-common";
import clsx from "clsx";

import IconSmile from "@/assets/icons/add.emoji.svg";
import { useRecentPicks } from "@/hooks/useRecentPicks";
import { EmojiTabbedPicker } from "./emoji-tabbed-picker";
import { StickerPicker, RecentSticker } from "./sticker-picker";

const STICKER_RECENT_MAX = 24;

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
  modeToggle: ReactNode;
};

function EmojiPanelInner({ options, onSelectEmoji, recents, pushRecent, modeToggle }: EmojiPanelInnerProps) {
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
      modeToggle={modeToggle}
    />
  );
}

const SmileIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
    <line x1="9" y1="9" x2="9.01" y2="9" />
    <line x1="15" y1="9" x2="15.01" y2="9" />
  </svg>
);

const StickerSwitchIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="10" r="3.2" />
    <circle cx="16.5" cy="9" r="2.6" />
    <path d="M5.5 18c1.2-2.5 4-4 7-4s5.5 1.5 7 4" />
  </svg>
);

type StickerPreview = { item: RecentSticker; url: string };

export const EmojiInputPanel = forwardRef<HTMLDivElement, PanelProps>(
  ({ options, onSelectEmoji, onSelectSticker }, ref) => {
    const [mode, setMode] = useState<Mode>("sticker");
    const [emojiRecents, pushEmojiRecent] = useRecentPicks<string>(
      "recent_emoji",
      32,
      (id) => id
    );
    const [stickerRecents, pushStickerRecent] = useRecentPicks<RecentSticker>(
      "recent_stickers",
      STICKER_RECENT_MAX,
      (s) => `${s.pack}/${s.id}`
    );
    const [preview, setPreview] = useState<StickerPreview | null>(null);

    // Reset preview whenever mode changes
    useEffect(() => {
      if (mode !== "sticker") setPreview(null);
    }, [mode]);

    const commitSticker = (p: StickerPreview) => {
      pushStickerRecent(p.item);
      onSelectSticker?.(p.url);
      // 不清空 preview，讓使用者可以連續點擊送出
    };

    const handleTapSticker = (item: RecentSticker, url: string) => {
      if (preview && preview.url === url) {
        commitSticker({ item, url });
      } else {
        setPreview({ item, url });
      }
    };

    const handlePreviewClick = () => {
      if (preview) commitSticker(preview);
    };

    const modeToggle = (
      <div className="flex items-center bg-bg-surface rounded-full mr-2 shrink-0 p-1 self-center h-10">
        <button
          type="button"
          tabIndex={-1}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setMode("sticker")}
          className={clsx(
            "flex-center w-8 h-full rounded-full transition-colors",
            mode === "sticker" ? "bg-bg-elevated text-accent shadow-sm" : "text-fg-subtle hover:text-fg-primary"
          )}
          title="貼圖"
        >
          <StickerSwitchIcon className="w-4 h-4" />
        </button>
        <button
          type="button"
          tabIndex={-1}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setMode("emoji")}
          className={clsx(
            "flex-center w-8 h-full rounded-full transition-colors",
            mode === "emoji" ? "bg-bg-elevated text-accent shadow-sm" : "text-fg-subtle hover:text-fg-primary"
          )}
          title="表情"
        >
          <SmileIcon className="w-4 h-4" />
        </button>
      </div>
    );

    return (
      <div ref={ref} className="w-full">
        {mode === "sticker" && preview && (
          <div
            role="button"
            tabIndex={-1}
            onMouseDown={(e) => e.preventDefault()}
            onClick={handlePreviewClick}
            className="absolute left-0 right-0 md:left-3 md:right-3 md:rounded-lg z-30 flex items-center justify-center bg-black/40 cursor-pointer"
            style={{
              bottom: "100%",
              height: "clamp(140px, 16vh, 160px)",
            }}
            title="點擊送出"
          >
            <img
              src={preview.url}
              alt="sticker preview"
              className="w-auto h-auto max-w-[240px] max-h-[90%] object-contain pointer-events-none select-none drop-shadow-lg"
              draggable={false}
            />
            <button
              type="button"
              tabIndex={-1}
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => {
                e.stopPropagation();
                setPreview(null);
              }}
              className="absolute top-2 right-2 w-8 h-8 flex-center rounded-full text-fg-primary/90 hover:bg-bg-hover"
              title="取消"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
        )}
        <div
          className="relative w-full bg-bg-elevated overflow-hidden flex flex-col"
          style={{ height: "35vh" }}
        >
          {/* Active panel */}
          <div className="flex-1 min-h-0">
            {mode === "emoji" ? (
              <Plate key="emoji_panel">
                <EmojiPanelInner
                  options={options}
                  onSelectEmoji={onSelectEmoji}
                  recents={emojiRecents}
                  pushRecent={pushEmojiRecent}
                  modeToggle={modeToggle}
                />
              </Plate>
            ) : (
              <StickerPicker
                recents={stickerRecents}
                previewUrl={preview?.url ?? null}
                onTapSticker={handleTapSticker}
                modeToggle={modeToggle}
              />
            )}
          </div>
        </div>
      </div>
    );
  }
);
EmojiInputPanel.displayName = "EmojiInputPanel";
