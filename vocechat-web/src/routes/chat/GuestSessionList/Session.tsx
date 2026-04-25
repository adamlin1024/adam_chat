import { FC, useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import clsx from "clsx";

import { useAppSelector } from "@/app/store";
import Avatar from "@/components/Avatar";
import { fromNowTime, resolveMsgTime } from "@/utils";
import { renderPreviewMessage } from "../../chat/utils";
import { shallowEqual } from "react-redux";

interface IProps {
  id: number;
  mid: number;
}
const Session: FC<IProps> = ({ id, mid }) => {
  const [data, setData] = useState<{
    name: string;
    icon: string;
    mid: number;
    is_public: boolean;
  }>();
  const messageData = useAppSelector((store) => store.message, shallowEqual);
  const userData = useAppSelector((store) => store.users.byId, shallowEqual);
  const channelData = useAppSelector((store) => store.channels.byId, shallowEqual);

  useEffect(() => {
    const tmp = channelData[id];
    if (!tmp) return;
    // channel
    const { name, icon = "", is_public } = tmp;
    setData({ name, icon, mid, is_public });
  }, [id, mid, userData, channelData]);
  if (!data) return null;
  const previewMsg = messageData[mid] || {};
  const { name, icon } = data;

  return (
    <li className="session no-native-touch">
      <NavLink
        className={({ isActive: linkActive }) =>
          clsx(
            `nav flex gap-2 rounded-lg p-2 w-full md:hover:bg-bg-hover/20`,
            linkActive && "bg-bg-hover/20"
          )
        }
        to={`/chat/channel/${id}`}
      >
        <div className="flex shrink-0 aspect-square">
          <Avatar
            width={40}
            height={40}
            className="icon rounded-full"
            type="channel"
            name={name}
            src={icon}
          />
        </div>
        <div className="w-full flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span
              className={clsx(
                `flex items-center gap-2 font-semibold text-sm text-fg-primary truncate`,
                resolveMsgTime(previewMsg) ? "max-w-[120px]" : "max-w-[190px]"
              )}
            >
              {name}
            </span>
            <span className="text-xs text-fg-subtle max-w-[80px] truncate">
              {fromNowTime(resolveMsgTime(previewMsg))}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-fg-muted w-36 truncate">
              {renderPreviewMessage(previewMsg)}
            </span>
          </div>
        </div>
      </NavLink>
    </li>
  );
};
export default Session;
