import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { shallowEqual } from "react-redux";
import { ELEMENT_PARAGRAPH } from "@udecode/plate-paragraph";

import { useAppSelector } from "@/app/store";
import Avatar from "@/components/Avatar";
import ChannelIcon from "@/components/ChannelIcon";
import IconSearch from "@/assets/icons/search.svg";
import IconBack from "@/assets/icons/arrow.left.svg";

type PickRow =
  | { type: "channel"; id: number; name: string; icon?: string; personal: boolean }
  | { type: "dm"; id: number; name: string; avatar?: string };

const buildDraftValue = (text: string) => [
  {
    id: "1",
    type: ELEMENT_PARAGRAPH,
    children: [{ text }],
  },
];

function SharePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");

  const channelIds = useAppSelector((s) => s.channels.ids, shallowEqual);
  const channelsById = useAppSelector((s) => s.channels.byId, shallowEqual);
  const dmIds = useAppSelector((s) => s.userMessage.ids, shallowEqual);
  const usersById = useAppSelector((s) => s.users.byId, shallowEqual);

  const sharedText = [params.get("title"), params.get("text"), params.get("url")]
    .filter(Boolean)
    .join("\n");

  const rows: PickRow[] = useMemo(() => {
    const channels: PickRow[] = channelIds.map((id) => {
      const c = channelsById[id];
      return {
        type: "channel",
        id,
        name: c?.name ?? "",
        icon: c?.icon,
        personal: !c?.is_public,
      };
    });
    const dms: PickRow[] = dmIds
      .map((id) => {
        const u = usersById[id];
        if (!u) return null;
        return { type: "dm", id, name: u.name, avatar: u.avatar } as PickRow;
      })
      .filter(Boolean) as PickRow[];
    const q = keyword.trim().toLowerCase();
    return [...channels, ...dms].filter((r) =>
      q ? r.name.toLowerCase().includes(q) : true
    );
  }, [channelIds, channelsById, dmIds, usersById, keyword]);

  const handlePick = (row: PickRow) => {
    const path = row.type === "channel" ? `/chat/channel/${row.id}` : `/chat/dm/${row.id}`;
    if (!sharedText) {
      navigate(path);
      return;
    }
    const key = `${row.type === "channel" ? "channel" : "dm"}_${row.id}`;
    try {
      localStorage.setItem(key, JSON.stringify(buildDraftValue(sharedText)));
    } catch {
      /* quota — silent */
    }
    navigate(path);
  };

  return (
    <div className="h-screen flex flex-col bg-bg-canvas">
      <header className="flex items-center gap-2 px-3 py-3 border-b border-border-subtle shrink-0">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="h-9 w-9 flex-center rounded-md hover:bg-bg-surface"
          aria-label="返回"
        >
          <IconBack className="w-5 h-5 stroke-fg-primary fill-none" />
        </button>
        <h1 className="text-base font-semibold text-fg-primary">分享到…</h1>
      </header>

      {sharedText && (
        <div className="mx-3 mt-3 p-3 rounded-lg bg-bg-surface text-sm text-fg-secondary whitespace-pre-wrap break-all max-h-[120px] overflow-auto">
          {sharedText}
        </div>
      )}

      <div className="px-3 py-3">
        <label className="flex items-center gap-2 px-3 py-2 rounded-md bg-bg-surface">
          <IconSearch className="w-4 h-4 fill-fg-subtle" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜尋頻道或聯絡人"
            className="flex-1 bg-transparent outline-none text-sm text-fg-primary placeholder:text-fg-subtle"
          />
        </label>
      </div>

      <ul className="flex-1 overflow-y-auto pb-6">
        {rows.length === 0 && (
          <li className="px-4 py-8 text-center text-fg-subtle text-sm">沒有符合的項目</li>
        )}
        {rows.map((row) => (
          <li
            key={`${row.type}-${row.id}`}
            className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-bg-surface transition-colors"
            onClick={() => handlePick(row)}
          >
            {row.type === "channel" ? (
              row.icon ? (
                <Avatar width={40} height={40} src={row.icon} name={row.name} type="channel" />
              ) : (
                <div className="h-10 w-10 flex-center rounded-md bg-bg-surface">
                  <ChannelIcon personal={row.personal} className="[&>svg]:w-5 [&>svg]:h-5" />
                </div>
              )
            ) : (
              <Avatar width={40} height={40} src={row.avatar} name={row.name} type="user" />
            )}
            <div className="flex-1 min-w-0">
              <div className="truncate text-sm font-medium text-fg-primary">{row.name}</div>
              <div className="text-xs text-fg-subtle">
                {row.type === "channel" ? "頻道" : "私訊"}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default SharePage;
