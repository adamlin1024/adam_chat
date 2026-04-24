import React, { FC, MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

import { ContentTypes } from "@/app/config";
import { MessagePayload } from "@/app/slices/message";
import { useAppSelector } from "@/app/store";
import { ChatContext } from "@/types/common";
import { getFileIcon, isImage } from "@/utils";
import { getStickerUrl } from "@/utils/sticker";
import Avatar from "../Avatar";
import LinkifyText from "../LinkifyText";
import MarkdownRender from "../MarkdownRender";
import ForwardedMessage from "./ForwardedMessage";
import { shallowEqual } from "react-redux";

const renderContent = (data: MessagePayload, context: ChatContext, to: number) => {
  const { content_type, content, thumbnail, properties, created_at, from_uid = 0 } = data;
  let res = null;
  switch (content_type) {
    case ContentTypes.text:
      res = (
        <span className="max-w-3xl md:break-words md:break-all text-gray-800 dark:text-gray-100 whitespace-break-spaces">
          <LinkifyText
            text={content as string}
            url={false}
            mentionTextOnly={true}
            mentionPopOver={false}
          />
        </span>
      );
      break;
    case ContentTypes.audio:
      res = <span className=" text-primary-400 text-sm">[Voice Message]</span>;
      break;
    case ContentTypes.markdown:
      {
        const stickerUrl = getStickerUrl(content as string);
        if (stickerUrl) {
          res = (
            <div className="flex items-center gap-1.5">
              <img
                src={stickerUrl}
                alt="sticker"
                className="w-8 h-8 object-contain"
                draggable={false}
              />
              <span className="text-fg-muted">[貼圖]</span>
            </div>
          );
        } else {
          res = (
            <div className="max-h-[152px] overflow-hidden dark:text-gray-100">
              <MarkdownRender content={content as string} />
            </div>
          );
        }
      }
      break;
    case ContentTypes.file:
      {
        const { content_type = "", name, size } = properties || {};
        const icon = getFileIcon(content_type, name, "w-4 h-5");
        if (isImage(content_type, size)) {
          res = <img className="w-10 h-10 object-cover" src={thumbnail || (content as string)} />;
        } else {
          res = (
            <div className="flex gap-1">
              {icon}
              <span className="ts-2xs text-gray-500 dark:text-gray-100">{name}</span>
            </div>
          );
        }
      }
      break;
    case ContentTypes.archive:
      {
        // const { size, name, file_type } = properties;
        res = (
          <ForwardedMessage
            properties={properties}
            context={context}
            to={to}
            from_uid={from_uid}
            created_at={created_at}
            id={content as string}
            thumbnail={thumbnail}
          />
        );
      }
      break;

    default:
      break;
  }
  return res;
};

interface ReplyProps {
  mid: number;
  interactive?: boolean;
  context: ChatContext;
  to?: number;
}

const Reply: FC<ReplyProps> = ({ mid, interactive = true, context, to = 0 }) => {
  const { t } = useTranslation("chat");
  const users = useAppSelector((store) => store.users.byId, shallowEqual);
  const data = useAppSelector((store) => store.message[mid], shallowEqual);
  const handleClick = (evt: MouseEvent<HTMLDivElement>) => {
    const { mid } = evt.currentTarget.dataset;
    const msgEle = document.querySelector<HTMLDivElement>(`[data-msg-mid='${mid}']`);
    if (msgEle) {
      const _class1 = `md:dark:bg-gray-800`;
      const _class2 = `md:bg-gray-100`;
      msgEle.classList.add(_class1);
      msgEle.classList.add(_class2);
      msgEle.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => {
        msgEle.classList.remove(_class1);
        msgEle.classList.remove(_class2);
      }, 3000);
    } else {
      // 消息不在DOM中，触发自定义事件让虚拟列表滚动
      const feedId = `VOCECHAT_FEED_${context}_${to}`;
      const feedEle = document.getElementById(feedId);
      if (feedEle) {
        feedEle.dispatchEvent(new CustomEvent('scrollToMessage', { detail: { mid: Number(mid) } }));
      }
    }
  };
  const defaultClass = `mb-1.5 rounded-r-sm border-l-2 border-accent bg-gradient-to-r from-accent/10 to-transparent px-2.5 py-0.5`;
  if (!data)
    return (
      <blockquote key={mid} data-mid={mid} className={clsx(defaultClass, "italic text-fg-muted ts-2xs")}>
        {t("reply_msg_del")}
      </blockquote>
    );
  const currUser = users[data.from_uid || 0];
  if (!currUser) return null;

  return (
    <blockquote
      key={mid}
      data-mid={mid}
      className={clsx(defaultClass, interactive ? "cursor-pointer" : "")}
      onClick={interactive ? handleClick : undefined}
    >
      <div className="font-mono ts-xs font-semibold text-accent">{currUser.name}</div>
      <div className={clsx("ts-meta text-fg-muted truncate", interactive && "relative")}>
        {renderContent(data, context, to)}
        {interactive && <div className="absolute top-0 left-0 w-full h-full"></div>}
      </div>
    </blockquote>
  );
};

export default React.memo(Reply, (prev, next) => {
  return prev.mid == next.mid;
});
