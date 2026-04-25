import { FC } from "react";

import LockHashIcon from "@/assets/icons/channel.private.svg";
import HashIcon from "@/assets/icons/channel.svg";

interface Props {
  personal?: boolean;
  muted?: boolean;
  className?: string;
}

const ChannelIcon: FC<Props> = ({ personal = false, muted = false, className = "" }) => {
  return (
    <div className={`flex ${muted ? "!text-fg-secondary" : ""} ${className}`}>
      {personal ? (
        <LockHashIcon className="fill-fg-body" />
      ) : (
        <HashIcon className="fill-fg-body" />
      )}
    </div>
  );
};

export default ChannelIcon;
