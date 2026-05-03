import { FC, useState } from "react";
import { LineWobble } from "@uiball/loaders";
import clsx from "clsx";

import useExpiredResMap from "@/hooks/useExpiredResMap";

interface Props {
  url: string;
  alt?: string;
}

const ImageBox: FC<Props> = ({ url, alt }) => {
  const [loaded, setLoaded] = useState(false);
  const { setExpired } = useExpiredResMap();

  // FileBox 上層的 HEAD probe 走 fetch，可能命中 SW / CDN cache 的 stale 200；
  // 真正的 <img> GET 才是 source of truth — 失敗就回報 expired，FileBox 下一輪
  // render 會把整張卡片移掉，避免永遠卡 loading。
  return (
    <div className="h-[218px] overflow-hidden flex-center relative">
      {!loaded && (
        <span className="absolute">
          <LineWobble color="rgb(21,91,117)" />
        </span>
      )}
      <img
        className={clsx("w-full h-full object-cover", !loaded && "invisible")}
        src={url}
        alt={alt}
        onLoad={() => setLoaded(true)}
        onError={() => setExpired(url)}
      />
    </div>
  );
};

export default ImageBox;
