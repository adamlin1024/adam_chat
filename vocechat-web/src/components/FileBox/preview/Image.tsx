import { FC, useState } from "react";
import { LineWobble } from "@uiball/loaders";
import clsx from "clsx";

interface Props {
  url: string;
  alt?: string;
}

// 注意：404 在 FileBox 上層已經先擋掉了（HEAD probe → setExpired → return null），
// 走到這裡的 url 已經是 validated 過或還在探測中。所以 ImagePreview 只負責畫面顯示，
// 不再做 404 / setExpired 處理。
const ImageBox: FC<Props> = ({ url, alt }) => {
  const [loaded, setLoaded] = useState(false);

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
      />
    </div>
  );
};

export default ImageBox;
