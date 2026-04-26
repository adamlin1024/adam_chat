import { FC, useState } from "react";
import { LineWobble } from "@uiball/loaders";
import clsx from "clsx";

import useExpiredResMap from "@/hooks/useExpiredResMap";

interface Props {
  url: string;
  alt?: string;
}

const ImageBox: FC<Props> = ({ url, alt }) => {
  const { isExpired, setExpired } = useExpiredResMap();
  const [status, setStatus] = useState<"loading" | "loaded" | "error">(
    isExpired(url) ? "error" : "loading"
  );

  if (status === "error") {
    return (
      <div className="h-[218px] flex-center bg-danger/20">
        <span className="text-lg text-danger">File not found, removed maybe</span>
      </div>
    );
  }

  return (
    <div className="h-[218px] overflow-hidden flex-center relative">
      {status === "loading" && (
        <span className="absolute">
          <LineWobble color="rgb(21,91,117)" />
        </span>
      )}
      <img
        className={clsx(
          "w-full h-full object-cover",
          status !== "loaded" && "invisible"
        )}
        src={url}
        alt={alt}
        onLoad={() => setStatus("loaded")}
        onError={() => {
          setExpired(url);
          setStatus("error");
        }}
      />
    </div>
  );
};

export default ImageBox;
