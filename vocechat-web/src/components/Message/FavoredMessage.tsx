import { FC } from "react";

import useFavMessage from "@/hooks/useFavMessage";
import { isMessageSavable } from "@/utils/messageType";
import Avatar from "../Avatar";
import FileActionBar from "../FileActionBar";
import renderContent from "./renderContent";

type Props = {
  id?: string;
};
const FavoredMessage: FC<Props> = ({ id = "" }) => {
  const { favorites } = useFavMessage({});
  if (!id) return null;

  const current = favorites.find((f) => f.id == id);
  const messages = current?.messages;
  if (!messages || messages.length === 0) return null;

  const favorite_mids = messages.map(({ from_mid }) => +from_mid);

  return (
    <div
      data-favorite-mids={favorite_mids.join(",")}
      className="favorite flex flex-col rounded-md bg-bg-surface"
    >
      <div className="list">
        {messages.map((msg: any, idx: number) => {
          const {
            user = {},
            from_mid,
            download,
            content,
            content_type,
            properties,
            thumbnail
          } = msg;
          const isFile = isMessageSavable(content_type);
          return (
            <div
              className="w-full relative flex items-start gap-3 px-2 py-1 my-2 rounded-lg md:hover:bg-bg-elevated"
              key={idx}
            >
              {user && (
                <div className="shrink-0 w-10 h-10 flex">
                  <Avatar
                    width={40}
                    height={40}
                    className="rounded-full object-cover"
                    src={user.avatar}
                    name={user.name}
                  />
                </div>
              )}
              <div className="w-full flex flex-col gap-2 text-sm min-w-0">
                <div className="flex items-center gap-2 font-semibold">
                  <span className="text-fg-primary">
                    {user?.name || "Deleted User"}
                  </span>
                </div>
                <div className="select-text text-fg-primary break-all whitespace-pre-wrap">
                  {renderContent({
                    download,
                    content,
                    content_type,
                    properties,
                    thumbnail
                  })}
                </div>
                {isFile && content && properties?.name && (
                  <FileActionBar
                    mid={+from_mid}
                    url={content}
                    fileName={properties.name}
                    mimeType={properties.content_type}
                    className="pt-1"
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FavoredMessage;
