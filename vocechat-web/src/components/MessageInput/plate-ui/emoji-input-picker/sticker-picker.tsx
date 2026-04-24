import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";

import { useRecentPicks } from "@/hooks/useRecentPicks";

export type StickerPack = {
  id: string;
  name: string;
  author?: string;
  tab_on: string;
  tab_off: string;
  stickers: { id: string; w: number; h: number }[];
};

export type RecentSticker = { pack: string; id: string };

const RECENT_ID = "_recent";
const RECENT_MAX = 24;

type Props = {
  onSelectSticker: (url: string) => void;
};

const ClockIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className}>
    <path d="M13 4h-2l-.001 7H9v2h2v2h2v-2h4v-2h-4z" />
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0m0 22C6.486 22 2 17.514 2 12S6.486 2 12 2s10 4.486 10 10-4.486 10-10 10" />
  </svg>
);

export function StickerPicker({ onSelectSticker }: Props) {
  const [packs, setPacks] = useState<StickerPack[]>([]);
  const [activePackId, setActivePackId] = useState<string | undefined>();
  const [loadError, setLoadError] = useState(false);
  const [recents, pushRecent] = useRecentPicks<RecentSticker>(
    "recent_stickers",
    RECENT_MAX,
    (s) => `${s.pack}/${s.id}`
  );

  useEffect(() => {
    fetch("/stickers/packs.json")
      .then((res) => {
        if (!res.ok) throw new Error("failed");
        return res.json();
      })
      .then((data: { packs: StickerPack[] }) => {
        setPacks(data.packs || []);
      })
      .catch(() => setLoadError(true));
  }, []);

  // Default active tab: always first pack
  useEffect(() => {
    if (activePackId !== undefined) return;
    if (packs.length === 0) return;
    setActivePackId(packs[0].id);
  }, [packs, activePackId]);

  const activePack = useMemo(
    () => packs.find((p) => p.id === activePackId),
    [packs, activePackId]
  );

  const packMap = useMemo(() => {
    const m: Record<string, StickerPack> = {};
    packs.forEach((p) => {
      m[p.id] = p;
    });
    return m;
  }, [packs]);

  const handleSelect = (pack: string, id: string) => {
    pushRecent({ pack, id });
    onSelectSticker(`/stickers/${pack}/${id}.png`);
  };

  if (loadError) {
    return (
      <div className="flex-center h-full text-xs text-fg-subtle">
        無法載入貼圖
      </div>
    );
  }

  if (packs.length === 0) {
    return (
      <div className="flex-center h-full text-xs text-fg-subtle">
        載入中…
      </div>
    );
  }

  const showingRecent = activePackId === RECENT_ID;
  const validRecents = recents.filter((r) => packMap[r.pack]);

  return (
    <div className="flex flex-col w-full h-full">
      {/* Pack tabs */}
      <div className="flex items-center gap-0.5 px-2 border-b border-border-subtle shrink-0 overflow-x-auto">
        {/* Recent tab */}
        <button
          type="button"
          tabIndex={-1}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setActivePackId(RECENT_ID)}
          className={clsx(
            "flex-center w-10 h-10 shrink-0 rounded transition-colors",
            showingRecent
              ? "text-accent bg-bg-surface"
              : "text-fg-subtle hover:text-fg-primary"
          )}
          title="最近使用"
        >
          <ClockIcon className="w-5 h-5 fill-current" />
        </button>
        {packs.map((pack) => {
          const active = activePackId === pack.id;
          return (
            <button
              key={pack.id}
              type="button"
              tabIndex={-1}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setActivePackId(pack.id)}
              className={clsx(
                "flex-center w-10 h-10 shrink-0 rounded transition-colors p-1",
                active ? "bg-bg-surface" : "hover:bg-bg-surface/50"
              )}
              title={pack.name}
            >
              <img
                src={active ? pack.tab_on : pack.tab_off}
                alt={pack.name}
                className="w-full h-full object-contain"
              />
            </button>
          );
        })}
      </div>

      {/* Sticker grid */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {showingRecent ? (
          validRecents.length === 0 ? (
            <div className="flex-center h-full text-xs text-fg-subtle">
              尚未使用過貼圖
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(72px,1fr))] gap-1">
              {validRecents.map((r) => {
                const thumbUrl = `/stickers/${r.pack}/${r.id}_key.png`;
                return (
                  <button
                    key={`${r.pack}/${r.id}`}
                    type="button"
                    tabIndex={-1}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect(r.pack, r.id)}
                    className="flex-center aspect-square rounded hover:bg-bg-surface transition-colors p-1"
                  >
                    <img
                      src={thumbUrl}
                      alt=""
                      loading="lazy"
                      className="max-w-full max-h-full object-contain"
                    />
                  </button>
                );
              })}
            </div>
          )
        ) : activePack ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(72px,1fr))] gap-1">
            {activePack.stickers.map((s) => {
              const thumbUrl = `/stickers/${activePack.id}/${s.id}_key.png`;
              return (
                <button
                  key={s.id}
                  type="button"
                  tabIndex={-1}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(activePack.id, s.id)}
                  className="flex-center aspect-square rounded hover:bg-bg-surface transition-colors p-1"
                >
                  <img
                    src={thumbUrl}
                    alt=""
                    loading="lazy"
                    className="max-w-full max-h-full object-contain"
                  />
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
