import { FC, MouseEvent } from "react";
import { useTranslation } from "react-i18next";

import FavoredMessage from "@/components/Message/FavoredMessage";
import useFavMessage from "@/hooks/useFavMessage";
import IconRemove from "@/assets/icons/close.svg";
import IconSurprise from "@/assets/icons/emoji.surprise.svg";

type Props = { cid?: number; uid?: number; bare?: boolean };
const FavList: FC<Props> = ({ cid = null, uid = null, bare = false }) => {
  const { t } = useTranslation("chat");
  const { favorites, removeFavorite } = useFavMessage({ cid, uid });
  const handleRemove = (evt: MouseEvent<HTMLButtonElement>) => {
    const { id = "" } = evt.currentTarget.dataset;
    removeFavorite(id);
  };
  const noFavs = favorites.length == 0;
  return (
    <div className={bare
      ? "w-full"
      : "p-3 bg-bg-elevated border border-border rounded-xl w-full md:min-w-[460px] max-h-[70vh] md:max-h-[480px] overflow-auto shadow-overlay"
    }>
      <h4 className="font-mono text-[11px] font-semibold text-fg-subtle uppercase tracking-widest mb-3 px-1">
        {t("fav_msg")} · {favorites.length}
      </h4>
      {noFavs ? (
        <div className="flex flex-col gap-2 w-full items-center p-6">
          <IconSurprise className="opacity-30" />
          <div className="font-mono text-[11px] text-fg-disabled text-center">
            {t("fav_empty_tip")}
          </div>
        </div>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {favorites.map(({ id }) => {
            return (
              <li
                key={id}
                className="relative border border-border rounded-md group overflow-hidden"
              >
                <FavoredMessage id={id} />
                <div className="flex items-center absolute top-1.5 right-1.5 border border-border bg-bg-surface rounded-sm overflow-hidden invisible group-hover:visible">
                  <button className="flex-center w-5 h-5 p-1" data-id={id} onClick={handleRemove}>
                    <IconRemove className="fill-fg-subtle" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
export default FavList;
