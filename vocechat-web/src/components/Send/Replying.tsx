import { Trans, useTranslation } from "react-i18next";
import { ContentTypes } from "@/app/config";
import { MessagePayload } from "@/app/slices/message";
import { useAppSelector } from "@/app/store";
import { ChatContext } from "@/types/common";
import useSendMessage from "@/hooks/useSendMessage";
import { getFileIcon, isImage } from "@/utils";
import { isStickerContent, getStickerUrl } from "@/utils/sticker";
import IconClose from "@/assets/icons/close.circle.svg";
import pictureIcon from "@/assets/icons/picture.svg?url";
import { shallowEqual } from "react-redux";

type Preview = {
  text: string;        // 一行預覽文字
  thumbUrl?: string;   // 右側 40×40 縮圖 url（圖片 / 貼圖）
  fileIcon?: React.ReactNode;
};

function getPreview(data: MessagePayload, t: (k: string, opts?: any) => string): Preview {
  const { content_type, content, thumbnail = "", properties } = data;
  switch (content_type) {
    case ContentTypes.audio:
      return { text: `[${t("voice_message", { ns: "chat" })}]` };
    case ContentTypes.markdown: {
      // 貼圖訊息：抽 sticker url 做縮圖；其他 markdown 顯示文字
      if (isStickerContent(content, content_type)) {
        const url = getStickerUrl(content as string);
        return { text: `[${t("sticker", { ns: "chat", defaultValue: "貼圖" })}]`, thumbUrl: url || undefined };
      }
      return { text: typeof content === "string" ? content : "" };
    }
    case ContentTypes.file: {
      const { content_type: ct = "", name, size } = properties || {};
      if (isImage(ct, size)) {
        return { text: `[${t("image", { ns: "chat" })}]`, thumbUrl: thumbnail || pictureIcon };
      }
      return {
        text: name || `[${t("file", { ns: "chat" })}]`,
        fileIcon: getFileIcon(ct, name, "w-4 h-5 fill-fg-secondary"),
      };
    }
    case ContentTypes.text:
    default:
      return { text: typeof content === "string" ? content : "" };
  }
}

export default function Replying({
  context,
  id,
  mid
}: {
  context: ChatContext;
  id: number;
  mid: number;
}) {
  const { t } = useTranslation();
  const { removeReplying } = useSendMessage({ to: id, context });
  const usersData = useAppSelector((store) => store.users.byId, shallowEqual);
  const msg = useAppSelector((store) => store.message[mid], shallowEqual);

  if (!msg) return null;
  const { from_uid = 0 } = msg;
  const user = usersData[from_uid];
  const preview = getPreview(msg, t);

  return (
    <div className="relative flex items-center gap-3 px-3 py-2 mx-1 mb-1 rounded-t-lg bg-bg-elevated border-l-2 border-accent">
      <div className="flex-1 min-w-0">
        <div className="ts-mini text-fg-secondary truncate">
          <Trans
            i18nKey="chat:replying_to"
            values={{ name: user?.name ?? "" }}
            components={[<span key="0" className="font-semibold text-fg-primary" />]}
          />
        </div>
        <div className="ts-meta text-fg-muted truncate flex items-center gap-1">
          {preview.fileIcon}
          <span className="truncate">{preview.text}</span>
        </div>
      </div>
      {preview.thumbUrl && (
        <img
          src={preview.thumbUrl}
          alt=""
          className="shrink-0 w-10 h-10 object-cover rounded border border-border-subtle"
        />
      )}
      <button
        type="button"
        onClick={removeReplying}
        className="shrink-0 w-7 h-7 flex-center rounded-full hover:bg-bg-hover active:bg-bg-hover text-fg-secondary transition-colors"
        title={t("action.cancel", { ns: "common" })}
      >
        <IconClose className="w-4 h-4 fill-current" />
      </button>
    </div>
  );
}
