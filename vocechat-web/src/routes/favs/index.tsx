import { MouseEvent, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import clsx from "clsx";
import dayjs from "dayjs";

import { ContentTypes } from "@/app/config";
import { Favorite } from "@/app/slices/favorites";
import { useAppSelector } from "@/app/store";
import FavoredMessage from "@/components/Message/FavoredMessage";
import useFavMessage from "@/hooks/useFavMessage";
import IconChannel from "@/assets/icons/channel.svg";
import IconRemove from "@/assets/icons/close.svg";
import IconAudio from "@/assets/icons/file.audio.svg";
import IconImage from "@/assets/icons/file.image.svg";
import IconUnknown from "@/assets/icons/file.unknown.svg";
import IconVideo from "@/assets/icons/file.video.svg";
import { shallowEqual } from "react-redux";

type filter = "audio" | "video" | "image" | "";

function FavsPage() {
  const { t } = useTranslation("fav");
  const [filter, setFilter] = useState<filter>("");
  const [favs, setFavs] = useState<Favorite[]>([]);
  const { removeFavorite } = useFavMessage({});
  const Filters = [
    {
      icon: <IconUnknown className="w-[15px] h-5" />,
      title: t("all_items"),
      filter: ""
    },
    {
      icon: <IconImage className="w-[15px] h-5" />,
      title: t("image"),
      filter: "image"
    },
    {
      icon: <IconVideo className="w-[15px] h-5" />,
      title: t("video"),
      filter: "video"
    },
    {
      icon: <IconAudio className="w-[15px] h-5" />,
      title: t("audio"),
      filter: "audio"
    }
  ];
  const favorites = useAppSelector((store) => store.favorites, shallowEqual);
  const channelData = useAppSelector((store) => store.channels.byId, shallowEqual);
  const userData = useAppSelector((store) => store.users.byId, shallowEqual);
  const handleFilter = (ftr: filter) => {
    setFilter(ftr);
  };
  useEffect(() => {
    if (!filter) {
      setFavs(favorites);
    } else {
      switch (filter) {
        case "audio":
          {
            setFavs(
              favorites.filter((f) => {
                const msgs = f.messages || [];
                return msgs.every((m) => {
                  const file_type = m.properties?.content_type;
                  return m.content_type == ContentTypes.file && file_type.startsWith("audio");
                });
              })
            );
          }
          break;
        case "video":
          {
            setFavs(
              favorites.filter((f) => {
                const msgs = f.messages || [];
                return msgs.every((m) => {
                  const file_type = m.properties?.content_type;
                  return m.content_type == ContentTypes.file && file_type.startsWith("video");
                });
              })
            );
          }
          break;
        // case "file":
        //   {
        //     const tmps = favorites.filter((f) => {
        //       const msgs = f.messages || [];
        //       return msgs.every((m) => {
        //         return m.content_type == ContentTypes.file;
        //       });
        //     });
        //     setFavs(tmps);
        //   }
        //   break;
        case "image":
          {
            const tmps = favorites.filter((f) => {
              const msgs = f.messages || [];
              return msgs.every((m) => {
                const file_type = m.properties?.content_type;
                return m.content_type == ContentTypes.file && file_type.startsWith("image");
              });
            });
            setFavs(tmps);
          }
          break;

        default:
          break;
      }
    }
  }, [filter, favorites]);
  const handleRemove = (evt: MouseEvent<HTMLButtonElement>) => {
    const { id = "" } = evt.currentTarget.dataset;
    // console.log("remove fav", id);
    removeFavorite(id);
  };
  return (
    <div className="h-screen flex bg-bg-canvas mt-2 mr-6 mb-2.5 overflow-auto rounded-lg border border-border-subtle">
      <div className="md:min-w-[200px] p-2 border-r border-border-subtle">
        <ul className="flex flex-col gap-0.5">
          {Filters.map(({ icon, title, filter: f }) => {
            return (
              <li
                key={f}
                className={clsx(
                  f == filter ? "bg-bg-surface shadow-inset-hairline text-fg-primary" : "text-fg-subtle",
                  `cursor-pointer flex items-center gap-2 px-2.5 py-[7px] rounded-md hover:bg-[#0f1014] transition-colors`
                )}
                onClick={handleFilter.bind(null, f as filter)}
              >
                <span className="[&>svg]:w-[14px] [&>svg]:h-[14px] [&>svg]:fill-current">{icon}</span>
                <span className="hidden md:block font-mono text-[11.5px] font-medium">
                  {title}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="w-full p-5 flex flex-col overflow-y-scroll no-scrollbar gap-6">
        {favs.map(({ id, created_at, messages }) => {
          if (!messages || messages.length == 0) return null;
          const [
            {
              source: { gid, uid }
            }
          ] = messages;
          const tip = (
            <span className={clsx("inline-flex items-center gap-1 mr-2")}>
              {gid ? (
                <>
                  <IconChannel className="w-3 h-3 fill-fg-subtle" /> <span className="text-fg-secondary">{channelData[gid]?.name}</span>
                </>
              ) : (
                <>
                  From{" "}
                  <strong className="font-semibold text-fg-secondary">
                    {userData[uid]?.name}
                  </strong>
                </>
              )}
            </span>
          );
          return (
            <div className="max-w-[600px] flex flex-col gap-1.5" key={id}>
              <h4 className="inline-flex items-center font-mono text-[10px] text-fg-disabled">
                {tip}
                {dayjs(created_at).format("YYYY-MM-DD")}
              </h4>
              <div className="relative group rounded-md border border-border overflow-hidden">
                <FavoredMessage key={id} id={id} />
                <button
                  className="absolute top-2 right-2 flex-center w-5 h-5 p-1 border border-border bg-bg-surface rounded-sm invisible group-hover:visible hover:border-border-strong transition-colors"
                  data-id={id}
                  onClick={handleRemove}
                >
                  <IconRemove className="fill-fg-subtle" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
export default FavsPage;
