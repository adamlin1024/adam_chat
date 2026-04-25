import { MouseEvent, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import clsx from "clsx";
import dayjs from "dayjs";
import Tippy from "@tippyjs/react";

import { ContentTypes } from "@/app/config";
import { Favorite } from "@/app/slices/favorites";
import { useAppSelector } from "@/app/store";
import FavoredMessage from "@/components/Message/FavoredMessage";
import useFavMessage from "@/hooks/useFavMessage";
import ImagePreviewModal from "@/components/ImagePreviewModal";
import EmptyState from "@/components/EmptyState";
import IconChannel from "@/assets/icons/channel.svg";
import IconRemove from "@/assets/icons/close.svg";
import IconAudio from "@/assets/icons/file.audio.svg";
import IconImage from "@/assets/icons/file.image.svg";
import IconUnknown from "@/assets/icons/file.unknown.svg";
import IconVideo from "@/assets/icons/file.video.svg";
import ArrowDown from "@/assets/icons/arrow.down.svg";
import CheckSign from "@/assets/icons/check.sign.svg";
import { shallowEqual } from "react-redux";

type filter = "audio" | "video" | "image" | "";

function FavsPage() {
  const { t } = useTranslation("fav");
  const [filter, setFilter] = useState<filter>("");
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const [favs, setFavs] = useState<Favorite[]>([]);
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null);
  const { removeFavorite } = useFavMessage({});
  const Filters = [
    { icon: <IconUnknown className="w-[15px] h-5" />, title: t("all_items"), filter: "" },
    { icon: <IconImage className="w-[15px] h-5" />, title: t("image"), filter: "image" },
    { icon: <IconVideo className="w-[15px] h-5" />, title: t("video"), filter: "video" },
    { icon: <IconAudio className="w-[15px] h-5" />, title: t("audio"), filter: "audio" },
  ];
  const favorites = useAppSelector((store) => store.favorites, shallowEqual);
  const channelData = useAppSelector((store) => store.channels.byId, shallowEqual);
  const userData = useAppSelector((store) => store.users.byId, shallowEqual);

  useEffect(() => {
    if (!filter) {
      setFavs(favorites);
      return;
    }
    setFavs(
      favorites.filter((f) => {
        const msgs = f.messages || [];
        return msgs.every((m) => {
          const file_type = m.properties?.content_type;
          return m.content_type == ContentTypes.file && file_type?.startsWith(filter);
        });
      })
    );
  }, [filter, favorites]);

  const handleRemove = (evt: MouseEvent<HTMLButtonElement>) => {
    const { id = "" } = evt.currentTarget.dataset;
    removeFavorite(id);
  };

  const selectedFilterLabel = Filters.find((f) => f.filter === filter)?.title ?? t("all_items");

  return (
    <div className="h-full flex overflow-hidden bg-bg-canvas md:mt-2 md:mr-6 md:mb-2.5 md:rounded-lg md:border md:border-border-subtle">
      {/* Right side */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header bar */}
        <div className="flex items-center px-4 py-2.5 border-b border-border-subtle shrink-0">
          <Tippy
            interactive
            visible={filterMenuVisible}
            onClickOutside={() => setFilterMenuVisible(false)}
            placement="bottom-start"
            popperOptions={{ strategy: "fixed" }}
            content={
              <div className="rounded-lg bg-bg-elevated border border-border-subtle shadow-lg overflow-auto max-h-[360px] min-w-[140px]">
                <ul className="flex flex-col py-1">
                  {Filters.map(({ title, filter: f }) => (
                    <li
                      key={f}
                      className="relative cursor-pointer flex items-center gap-2.5 px-3 py-2.5 hover:bg-bg-surface transition-colors"
                      onClick={() => {
                        setFilter(f as filter);
                        setFilterMenuVisible(false);
                      }}
                    >
                      <span className="text-fg-secondary font-medium ts-meta flex-1">{title}</span>
                      {filter === f && <CheckSign className="fill-accent" />}
                    </li>
                  ))}
                </ul>
              </div>
            }
          >
            <button
              onClick={() => setFilterMenuVisible((v) => !v)}
              className={clsx(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors",
                filter
                  ? "bg-bg-surface shadow-inset-hairline text-fg-primary"
                  : "text-fg-subtle border border-border-subtle hover:bg-bg-hover"
              )}
            >
              <span>{selectedFilterLabel}</span>
              <ArrowDown className="w-3 h-3 shrink-0 stroke-current fill-none" />
            </button>
          </Tippy>
        </div>

        {/* Content */}
        <div
          className={clsx(
            "flex-1 overflow-y-auto no-scrollbar p-4 md:p-5 pb-[80px] md:pb-6",
            favs.length === 0
              ? "flex items-center justify-center"
              : "flex flex-col gap-6"
          )}
        >
          {favs.length === 0 && (
            <EmptyState
              icon={<IconUnknown className="w-7 h-7" />}
              title="沒有收藏"
              desc="長按或右鍵訊息可以加入收藏，留在這裡長期保存"
            />
          )}
          {favs.map(({ id, created_at, messages }) => {
            if (!messages || messages.length === 0) return null;
            const [{ source: { gid, uid } }] = messages;
            const tip = (
              <span className="inline-flex items-center gap-1 mr-2">
                {gid ? (
                  <>
                    <IconChannel className="w-3 h-3 fill-fg-subtle" />
                    <span className="text-fg-secondary">{channelData[gid]?.name}</span>
                  </>
                ) : (
                  <>
                    From{" "}
                    <strong className="font-semibold text-fg-secondary">{userData[uid]?.name}</strong>
                  </>
                )}
              </span>
            );

            // Check if this favorite contains a single image message
            const singleImageMsg = messages.length === 1 && messages[0].content_type === ContentTypes.file
              && /^image/i.test(messages[0].properties?.content_type || "")
              ? messages[0]
              : null;

            return (
              <div className="max-w-[600px] flex flex-col gap-1.5" key={id}>
                <h4 className="inline-flex items-center font-mono ts-2xs text-fg-disabled">
                  {tip}
                  {dayjs(created_at).format("YYYY-MM-DD")}
                </h4>
                <div className="relative rounded-md border border-border overflow-hidden">
                  <div
                    className={clsx(singleImageMsg && "cursor-pointer")}
                    onClick={singleImageMsg ? () => setPreviewImage({ url: singleImageMsg.content, name: singleImageMsg.properties?.name || "" }) : undefined}
                  >
                    <FavoredMessage key={id} id={id} />
                  </div>
                  <button
                    className="absolute top-2 right-2 flex-center w-6 h-6 p-1 border border-border bg-bg-surface rounded-sm hover:border-border-strong transition-colors"
                    data-id={id}
                    onClick={handleRemove}
                    aria-label="移除收藏"
                  >
                    <IconRemove className="fill-fg-subtle" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {previewImage && (
        <ImagePreviewModal
          data={{ originUrl: previewImage.url, name: previewImage.name }}
          closeModal={() => setPreviewImage(null)}
        />
      )}
    </div>
  );
}

export default FavsPage;
