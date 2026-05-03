import React, { FC } from "react";

import useExpiredResMap from "@/hooks/useExpiredResMap";

interface Props {
  url: string;
}

const Video: FC<Props> = ({ url }) => {
  const { setExpired } = useExpiredResMap();
  return (
    <div className="h-[218px]">
      <video
        className="w-full h-full object-cover"
        controls
        src={url}
        onError={() => setExpired(url)}
      />
    </div>
  );
};

export default Video;
