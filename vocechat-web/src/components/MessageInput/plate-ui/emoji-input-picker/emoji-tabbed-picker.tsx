import { useEffect, useMemo, useState } from "react";
import { Emoji, UseEmojiPickerType } from "@udecode/plate-emoji";
import clsx from "clsx";

import { emojiCategoryIcons, emojiSearchIcons } from "./emoji-icons";

const RECENT_ID = "_recent";

type Props = Pick<
  UseEmojiPickerType,
  | "searchValue"
  | "setSearch"
  | "clearSearch"
  | "isSearching"
  | "searchResult"
  | "onSelectEmoji"
  | "emojiLibrary"
> & {
  recents?: string[];
};

export function EmojiTabbedPicker({
  searchValue,
  setSearch,
  clearSearch,
  isSearching,
  searchResult,
  onSelectEmoji,
  emojiLibrary,
  recents = []
}: Props) {
  const sections = useMemo(() => {
    const all = emojiLibrary.getGrid().sections();
    return all.filter((s) => s.id !== "frequent");
  }, [emojiLibrary]);

  const [activeCategoryId, setActiveCategoryId] = useState<string | undefined>(
    () => sections[0]?.id
  );

  useEffect(() => {
    if (!activeCategoryId && sections.length > 0) {
      setActiveCategoryId(sections[0].id);
    }
  }, [sections, activeCategoryId]);

  const recentEmojis = useMemo<Emoji[]>(() => {
    return recents
      .map((id) => emojiLibrary.getEmoji(id))
      .filter((e): e is Emoji => Boolean(e));
  }, [recents, emojiLibrary]);

  const displayedEmojis = useMemo<Emoji[]>(() => {
    if (isSearching) return searchResult as Emoji[];
    if (!activeCategoryId) return [];
    if (activeCategoryId === RECENT_ID) return recentEmojis;
    const section = emojiLibrary.getGrid().section(activeCategoryId as any);
    if (!section) return [];
    const ids: string[] = [];
    section.getRows().forEach((row) => {
      row.elements.forEach((id: string) => ids.push(id));
    });
    return ids
      .map((id) => emojiLibrary.getEmoji(id))
      .filter((e): e is Emoji => Boolean(e));
  }, [activeCategoryId, isSearching, searchResult, emojiLibrary, recentEmojis]);

  const showingRecent = activeCategoryId === RECENT_ID;

  return (
    <div className="flex flex-col w-full h-full">
      {/* Tabs */}
      <div className="flex items-center gap-0.5 px-2 border-b border-border-subtle shrink-0 overflow-x-auto">
        {/* Recent tab */}
        <button
          type="button"
          tabIndex={-1}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            if (isSearching) clearSearch();
            setActiveCategoryId(RECENT_ID);
          }}
          className={clsx(
            "flex-center w-9 h-8 shrink-0 rounded transition-colors",
            !isSearching && showingRecent
              ? "text-accent"
              : "text-fg-subtle hover:text-fg-primary"
          )}
          title="最近使用"
        >
          <span className="w-5 h-5 [&_svg]:w-full [&_svg]:h-full [&_svg]:fill-current">
            {emojiCategoryIcons.frequent.outline}
          </span>
        </button>
        {sections.map(({ id }) => {
          const active = !isSearching && activeCategoryId === id;
          const iconDef = emojiCategoryIcons[id as keyof typeof emojiCategoryIcons];
          return (
            <button
              key={id}
              type="button"
              tabIndex={-1}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                if (isSearching) clearSearch();
                setActiveCategoryId(id);
              }}
              className={clsx(
                "flex-center w-9 h-8 shrink-0 rounded transition-colors",
                active
                  ? "text-accent"
                  : "text-fg-subtle hover:text-fg-primary"
              )}
            >
              <span className="w-5 h-5 [&_svg]:w-full [&_svg]:h-full [&_svg]:fill-current">
                {iconDef?.outline}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="px-2 pt-2 pb-1 shrink-0">
        <div className="relative">
          <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-fg-subtle [&_svg]:w-full [&_svg]:h-full [&_svg]:fill-current">
            {emojiSearchIcons.loupe}
          </span>
          <input
            type="text"
            placeholder="搜尋"
            autoComplete="off"
            aria-label="搜尋"
            className="block w-full appearance-none rounded-md border-0 bg-bg-surface text-fg-primary text-sm pl-7 pr-7 py-1.5 outline-none placeholder:text-fg-subtle"
            onChange={(e) => setSearch(e.target.value)}
            value={searchValue}
          />
          {searchValue && (
            <button
              type="button"
              tabIndex={-1}
              onMouseDown={(e) => e.preventDefault()}
              onClick={clearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-fg-subtle hover:text-fg-primary [&_svg]:w-full [&_svg]:h-full [&_svg]:fill-current"
            >
              {emojiSearchIcons.delete}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-2 py-1">
        {displayedEmojis.length === 0 ? (
          <div className="flex-center h-full text-xs text-fg-subtle">
            {isSearching
              ? "找不到符合的表情"
              : showingRecent
                ? "尚未使用過表情"
                : ""}
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(34px,1fr))]">
            {displayedEmojis.map((emoji, i) => (
              <button
                key={emoji.id || i}
                type="button"
                tabIndex={-1}
                aria-label={emoji.skins?.[0]?.native}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onSelectEmoji(emoji)}
                className="flex-center h-8 w-8 rounded hover:bg-bg-surface text-xl leading-none"
              >
                {emoji.skins?.[0]?.native}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
