import { FC, ReactEventHandler, useState } from "react";

import useExpiredResMap from "@/hooks/useExpiredResMap";

interface Props {
  url: string;
}

const Audio: FC<Props> = ({ url }) => {
  const [err, setErr] = useState(false);
  const { setExpired } = useExpiredResMap();

  const handleError: ReactEventHandler<HTMLAudioElement> = (e) => {
    console.error("audio err", e);
    setErr(true);
    setExpired(url);
  };

  if (!url) return null;
  return (
    <div className="flex-center h-full">
      {err ? (
        <div className="p-[18px] text-fg-muted">Unable to play this audio</div>
      ) : (
        <audio className="w-full" controls src={url} onError={handleError} />
      )}
    </div>
  );
};

export default Audio;
