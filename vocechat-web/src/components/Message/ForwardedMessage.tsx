import { FC, ReactElement, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { ChatContext } from "@/types/common";
import useNormalizeMessage from "@/hooks/useNormalizeMessage";
import IconForward from "@/assets/icons/forward.svg";
import Avatar from "../Avatar";
import renderContent from "./renderContent";

type Props = {
  context: ChatContext;
  to: number;
  from_uid: number;
  id: string;
};
const ForwardedMessage: FC<Props> = ({ context, to, from_uid, id }) => {
  const { t } = useTranslation();
  const { messages, isLoading } = useNormalizeMessage(id);
  const [forwards, setForwards] = useState<ReactElement | null>(null);

  useEffect(() => {
    if (messages) {
      const forward_mids = messages.map(({ from_mid }) => from_mid) || [];
      // console.log("fff", messages);
      setForwards(
        <div
          data-forwarded-mids={forward_mids.join(",")}
          className="flex flex-col text-left rounded-lg bg-bg-elevated"
        >
          <h4 className="p-2 pb-0 flex items-center gap-1 text-fg-muted text-xs">
            <IconForward className="w-4 h-4 fill-fg-muted" />
            {t("action.forward")}
          </h4>
          <div className="list">
            {messages.map((msg, idx) => {
              const { user = {}, download, content, content_type, properties, thumbnail } = msg;
              return (
                <div
                  className="w-full relative flex items-start gap-4 px-2 py-1 my-2 rounded-lg"
                  key={idx}
                >
                  {user && (
                    <div className="w-6 h-6 rounded-full flex shrink-0 overflow-hidden">
                      <Avatar width={24} height={24} src={user.avatar} name={user.name} />
                    </div>
                  )}
                  <div className="w-full flex flex-col">
                    <div className="flex items-center gap-2 font-semibold">
                      <span className="text-fg-muted text-sm">{user?.name || "Deleted User"}</span>
                    </div>
                    <div className="select-text text-fg-muted text-sm break-all whitespace-pre-wrap text-fg-primary">
                      {renderContent({
                        download,
                        context,
                        to,
                        from_uid,
                        content,
                        content_type,
                        properties,
                        thumbnail
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
  }, [messages, context, to, from_uid]);
  if (!id) return null;
  if (isLoading) return <span className="text-sm text-fg-primary">Loading</span>;

  return forwards;
};

export default ForwardedMessage;
