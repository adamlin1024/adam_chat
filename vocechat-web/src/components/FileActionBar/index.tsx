import toast from "react-hot-toast";
import clsx from "clsx";

import IconCopy from "@/assets/icons/copy.svg";
import IconDownload from "@/assets/icons/download.svg";
import IconBookmark from "@/assets/icons/bookmark.svg";
import useCopy from "@/hooks/useCopy";
import useFavMessage from "@/hooks/useFavMessage";
import { fileKeyFromUrl } from "@/utils/messageType";
import SaveToCloudButton from "../SaveToCloudButton";

type Props = {
  /** 訊息 mid（用於收藏 / 取消收藏；給 0 或 undefined 會隱藏收藏按鈕） */
  mid?: number;
  /** 檔案下載 / 複製連結 */
  url: string;
  fileName: string;
  mimeType?: string;
  className?: string;
  /** 收藏按鈕點擊後額外行為（例如關閉 menu） */
  onFavorited?: () => void;
};

const ACTION_BTN =
  "flex-center w-8 h-8 rounded-md text-fg-secondary hover:text-fg-primary hover:bg-bg-hover transition-colors";

const FileActionBar = ({
  mid,
  url,
  fileName,
  mimeType,
  className,
  onFavorited
}: Props) => {
  const { copy, copied } = useCopy();
  const { addFavorite, removeFavorite, isFavorited, getFavoriteId } = useFavMessage({});

  const showFav = typeof mid === "number" && mid > 0;
  const favorited = showFav ? isFavorited(mid) : false;

  const onFavToggle = async () => {
    if (!showFav) return;
    if (favorited) {
      const favId = getFavoriteId(mid);
      if (favId) removeFavorite(favId);
      toast.success("已取消收藏");
    } else {
      const ok = await addFavorite(mid);
      if (ok) {
        toast.success("已加入收藏");
        onFavorited?.();
      }
    }
  };

  return (
    <div className={clsx("flex items-center gap-1", className)}>
      <a
        href={`${url}&download=true`}
        download={fileName}
        className={ACTION_BTN}
        aria-label="下載"
      >
        <IconDownload className="size-5 fill-current" />
      </a>

      <button
        type="button"
        onClick={() => copy(url, false)}
        disabled={copied}
        className={ACTION_BTN}
        aria-label="複製連結"
      >
        <IconCopy className="size-5 fill-current" />
      </button>

      <SaveToCloudButton
        fileKey={fileKeyFromUrl(url)}
        downloadUrl={url}
        fileName={fileName}
        mimeType={mimeType}
        className={ACTION_BTN}
        iconClassName="size-5"
      />

      {showFav && (
        <button
          type="button"
          onClick={onFavToggle}
          className={clsx(
            ACTION_BTN,
            favorited && "!text-accent hover:!text-accent"
          )}
          aria-label={favorited ? "取消收藏" : "加入收藏"}
        >
          <IconBookmark className="size-5 fill-current" />
        </button>
      )}
    </div>
  );
};

export default FileActionBar;
