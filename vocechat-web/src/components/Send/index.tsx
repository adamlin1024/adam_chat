import { FC, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

import { ChatPrefixes, ContentTypes } from "@/app/config";
import { updateInputMode } from "@/app/slices/ui";
import { useAppDispatch, useAppSelector } from "@/app/store";
import { ChatContext } from "@/types/common";
import MarkdownEditor from "@/components/MarkdownEditor";
import useAddLocalFileMessage from "@/hooks/useAddLocalFileMessage";
import useDraft from "@/hooks/useDraft";
import useSendMessage from "@/hooks/useSendMessage";
import useUploadFile from "@/hooks/useUploadFile";
import useUserOperation from "@/hooks/useUserOperation";
import Replying from "./Replying";
import Toolbar from "./Toolbar";
import PlusMenu from "./PlusMenu";
import UploadFileList from "./UploadFileList";
import { shallowEqual } from "react-redux";
import MessageInput from "../MessageInput";
import { Emoji } from "@udecode/plate-emoji";
import { EmojiInputButton, EmojiInputPanel } from "../MessageInput/plate-ui/emoji-input-picker";
import { MessageWithMentions } from "@/types/message";
import { PlateEditor } from "@udecode/plate-common";
import { Transforms, Editor as SlateEditor } from "slate";
import { VirtualMessageFeedHandle } from "@/routes/chat/Layout/VirtualMessageFeed";

const Modes = {
  text: "text",
  markdown: "markdown",
};
interface IProps {
  context?: ChatContext;
  id: number;
  feedRef?: React.RefObject<VirtualMessageFeedHandle>;
}
const Send: FC<IProps> = ({
  // 发给谁，或者是 channel，或者是 user
  context = "channel",
  id,
  feedRef,
}) => {
  const editorRef = useRef<PlateEditor | null>(null);
  const sendingRef = useRef(false);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const emojiPanelRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  const { t } = useTranslation("chat");
  const { unblockThisContact, blocked, isChannelOwner } = useUserOperation({
    uid: context == "dm" ? id : undefined,
    cid: context == "channel" ? id : undefined,
  });
  const { resetStageFiles } = useUploadFile({ context, id });
  const { getDraft, getUpdateDraft } = useDraft({ context, id });
  const [msg, setMsg] = useState<MessageWithMentions>({
    text: "",
    mentions: [],
  });
  const [markdownEditor, setMarkdownEditor] = useState(null);
  const [markdownFullscreen, setMarkdownFullscreen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const dispatch = useAppDispatch();
  const addLocalFileMessage = useAddLocalFileMessage({ context, to: id });
  // 谁发的
  const from_uid = useAppSelector((store) => store.authData.user?.uid, shallowEqual);
  const replying_mid = useAppSelector(
    (store) => store.message.replying[`${context}_${id}`],
    shallowEqual
  );
  const mode = useAppSelector((store) => store.ui.inputMode, shallowEqual);
  const uploadFiles = useAppSelector(
    (store) => store.ui.uploadFiles[`${context}_${id}`] ?? [],
    shallowEqual
  );
  const uids = useAppSelector((store) => store.users.ids, shallowEqual);
  const channelsData = useAppSelector((store) => store.channels.byId, shallowEqual);
  const usersData = useAppSelector((store) => store.users.byId, shallowEqual);
  const { sendMessage } = useSendMessage({ context, from: from_uid, to: id });

  const insertEmoji = (emoji: Emoji) => {
    const { native } = emoji.skins[0];
    if (mode == Modes.markdown && markdownEditor) {
      markdownEditor.insertText(native);
      return;
    }
    if (editorRef.current) {
      const editor = editorRef.current as any;
      if (!editor.selection) {
        Transforms.select(editor, SlateEditor.end(editor, []));
      }
      Transforms.insertText(editor, native);
    }
  };
  const toggleEmoji = () => {
    setEmojiOpen((prev) => {
      const next = !prev;
      if (next) {
        if (typeof document !== "undefined") {
          const active = document.activeElement as HTMLElement | null;
          active?.blur?.();
        }
      }
      return next;
    });
  };
  useEffect(() => {
    if (!emojiOpen) return;
    const handler = (e: Event) => {
      const target = e.target as Node;
      if (emojiPanelRef.current?.contains(target)) return;
      if (emojiButtonRef.current?.contains(target)) return;
      if (toolbarRef.current?.contains(target)) return;
      setEmojiOpen(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [emojiOpen]);
  const handleSendMessage = async () => {
    if (!id || sendingRef.current) return;
    sendingRef.current = true;
    if (editorRef.current) {
      // Clear content via Transforms (no blur → iOS keyboard stays up)
      const e = editorRef.current as any;
      Transforms.select(e, SlateEditor.range(e, []));
      Transforms.delete(e);
    }
    if (msg.text.trim()) {
      // send text msg
      const { text, mentions } = msg;
      const properties = { mentions };
      properties.local_id = +new Date();
      await sendMessage({
        id,
        reply_mid: replying_mid,
        type: "text",
        content: text,
        from_uid,
        properties,
      });
    }
    // send files
    if (uploadFiles.length !== 0) {
      // Notify the feed that files are being sent (should trigger scroll)
      feedRef?.current?.notifyFileSending();

      uploadFiles.forEach((fileInfo) => {
        const ts = +new Date();
        const { url, name, size, type } = fileInfo;
        const tmpMsg = {
          mid: ts,
          content: url,
          content_type: ContentTypes.file,
          created_at: ts,
          properties: {
            content_type: type,
            name,
            size,
            local_id: ts,
          },
          from_uid,
          sending: true,
        };
        addLocalFileMessage(tmpMsg);
      });
      resetStageFiles();
    }
    sendingRef.current = false;
  };
  const sendMarkdown = async (content: string) => {
    sendMessage({
      id,
      reply_mid: replying_mid,
      type: "markdown",
      content,
      from_uid,
      properties: { local_id: +new Date() },
    });
  };
  const insertSticker = (url: string) => {
    sendMarkdown(`![sticker](${url})`);
    setEmojiOpen(false);
  };
  const toggleMode = () => {
    dispatch(updateInputMode(mode == Modes.text ? Modes.markdown : Modes.text));
  };
  const toggleMarkdownFullscreen = () => {
    setMarkdownFullscreen((prev) => !prev);
  };
  const name = context == "channel" ? channelsData[id]?.name : usersData[id]?.name;
  const placeholder = `${t("send_to")} ${ChatPrefixes[context]}${name} `;
  const members =
    context == "channel" ? (channelsData[id]?.is_public ? uids : channelsData[id]?.members) : [];
  const isMarkdownMode = mode == Modes.markdown;
  const onlyOwnerCanSend = !!(context == "channel"
    ? channelsData[id]?.only_owner_can_send_msg
    : false);
  const canNotSendMessageInChannel = !isChannelOwner && onlyOwnerCanSend;
  if (canNotSendMessageInChannel) {
    return null;
  }
  if (context == "dm" && blocked) {
    return (
      <div className="mx-5 mb-4 px-4 py-3 rounded-lg border border-danger/30 bg-danger/10 text-danger font-mono ts-xs flex items-center gap-3">
        {t("contact_block_tip")}
        <button className="underline hover:no-underline" onClick={unblockThisContact}>
          {t("unblock")}
        </button>
      </div>
    );
  }
  return (
    <>
      {/* PC input */}
      <div
        className={clsx(
          `send relative w-full px-0 pt-2 pb-4 md:px-3 md:pb-3 ${mode} ${
            markdownFullscreen ? "fullscreen" : ""
          } ${replying_mid ? "reply" : ""} ${context}`,
          isMarkdownMode && markdownFullscreen && "-mt-9"
        )}
      >
        {replying_mid && <Replying context={context} mid={replying_mid} id={id} />}
        {mode == Modes.text && <UploadFileList context={context} id={id} />}

        <div
          className={clsx(
            `flex items-center gap-2 border-t border-border bg-bg-sidebar px-2.5 py-2.5 transition-colors md:rounded-lg md:border md:px-3`,
            isMarkdownMode && `!rounded-lg md:!border !px-3.5 !py-3 grid grid-cols-[1fr_1fr] grid-rows-[auto_auto] gap-0 focus-within:bg-bg-canvas md:focus-within:border-border-strong`
          )}
        >
          {mode == Modes.text && (
            <>
              <PlusMenu
                context={context}
                to={id}
                isMarkdown={false}
                toggleMode={toggleMode}
              />
              <div className="flex-1 flex items-center gap-1 min-w-0 rounded-3xl bg-bg-canvas border border-border focus-within:border-border-strong pl-4 pr-1 py-1 min-h-[40px] transition-colors">
                <MessageInput
                  editorRef={editorRef}
                  members={members}
                  id={`${context}_${id}`}
                  updateMessage={setMsg}
                  sendMessage={handleSendMessage}
                  placeholder={placeholder}
                />
                <EmojiInputButton ref={emojiButtonRef} open={emojiOpen} onToggle={toggleEmoji} />
              </div>
              <Toolbar
                ref={toolbarRef}
                sendMessages={handleSendMessage}
                sendVisible={msg.text.trim().length > 0 || uploadFiles.length > 0}
                mode={mode}
                fullscreen={markdownFullscreen}
                toggleMarkdownFullscreen={toggleMarkdownFullscreen}
              />
            </>
          )}
          {mode == Modes.markdown && (
            <>
              <div className="flex items-center gap-2">
                <PlusMenu
                  context={context}
                  to={id}
                  isMarkdown={true}
                  toggleMode={toggleMode}
                />
                <EmojiInputButton ref={emojiButtonRef} open={emojiOpen} onToggle={toggleEmoji} />
              </div>
              <Toolbar
                ref={toolbarRef}
                sendMessages={handleSendMessage}
                sendVisible={msg.text.trim().length > 0 || uploadFiles.length > 0}
                mode={mode}
                fullscreen={markdownFullscreen}
                toggleMarkdownFullscreen={toggleMarkdownFullscreen}
              />
              <MarkdownEditor
                updateDraft={getUpdateDraft("markdown")}
                initialValue={getDraft("markdown")}
                height={markdownFullscreen ? `calc(100dvh - 168px)` : `30vh`}
                placeholder={placeholder}
                setEditorInstance={setMarkdownEditor}
                sendMarkdown={sendMarkdown}
              />
            </>
          )}
        </div>
        {emojiOpen && (
          <EmojiInputPanel
            ref={emojiPanelRef}
            options={{ closeOnSelect: false }}
            onSelectEmoji={insertEmoji}
            onSelectSticker={insertSticker}
          />
        )}
      </div>
    </>
  );
};

export default Send;
