import { FC } from "react";

import ChannelIcon from "@/components/ChannelIcon";
import useFilteredChannels from "@/hooks/useFilteredChannels";
import CheckSign from "@/assets/icons/check.sign.svg";

type Props = {
  select: number;
  updateFilter: (param: { gid?: number }) => void;
};
const Channel: FC<Props> = ({ select = 0, updateFilter }) => {
  const { channels } = useFilteredChannels();
  const handleClick = (gid?: number) => {
    updateFilter({ gid });
  };

  return (
    <div className="rounded-lg bg-bg-elevated border border-border-subtle shadow-lg overflow-auto max-h-[360px] min-w-[200px]">
      <ul className="flex flex-col py-1">
        <li
          className="relative cursor-pointer flex items-center gap-2.5 px-3 py-2.5 hover:bg-bg-surface transition-colors"
          onClick={handleClick.bind(null, undefined)}
        >
          <ChannelIcon className="text-fg-subtle" />
          <span className="text-fg-secondary font-medium ts-meta flex-1">Any Channel</span>
          {!select && <CheckSign className="fill-accent" />}
        </li>
        {channels.map(({ gid, is_public, name }) => (
          <li
            key={gid}
            className="relative cursor-pointer flex items-center gap-2.5 px-3 py-2.5 hover:bg-bg-surface transition-colors"
            onClick={handleClick.bind(null, gid)}
          >
            <ChannelIcon personal={!is_public} className="text-fg-subtle" />
            <span className="text-fg-secondary font-medium ts-meta flex-1 truncate">{name}</span>
            {select == gid && <CheckSign className="fill-accent" />}
          </li>
        ))}
      </ul>
    </div>
  );
};
export default Channel;
