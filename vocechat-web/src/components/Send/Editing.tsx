import { FC, useEffect, useRef, useState } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";

import { ContentTypes } from "@/app/config";
import { useEditMessageMutation } from "@/app/services/message";
import { useAppSelector } from "@/app/store";
import { ChatContext } from "@/types/common";
import { removeEditingMessage } from "@/app/slices/message";
import { shallowEqual } from "react-redux";
import IconCheck from "@/assets/icons/check.sign.svg";
import IconClose from "@/assets/icons/close.svg";

type Props = {
  context: ChatContext;
  id: number;
  mid: number;
};

/**
 * 訊息輸入區的「編輯訊息」面板（取代正常輸入區）。
 * 用於手機版：編輯時氣泡保持不動，文字在這裡編輯，鍵盤自然彈起。
 * 桌機版仍走 EditMessage 在氣泡內編輯。
 */
const Editing: FC<Props> = ({ context, id, mid }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const msg = useAppSelector((store) => store.message[mid], shallowEqual);
  const [text, setText] = useState<string>(typeof msg?.content === "string" ? msg.content : "");
  const [edit, { isLoading, isSuccess }] = useEditMessageMutation();

  const close = () => dispatch(removeEditingMessage(`${context}_${id}`));

  useEffect(() => {
    if (isSuccess) close();
  }, [isSuccess]);

  // 開啟時自動 focus 觸發鍵盤
  useEffect(() => {
    inputRef.current?.focus();
    const len = inputRef.current?.value.length ?? 0;
    inputRef.current?.setSelectionRange(len, len);
  }, []);

  if (!msg) {
    close();
    return null;
  }

  const handleSave = () => {
    if (!text.trim()) return;
    edit({
      mid,
      content: text,
      type: msg.content_type === ContentTypes.markdown ? "markdown" : "text"
    });
  };

  return (
    <div className="flex items-center gap-2 border-t border-border bg-bg-sidebar px-2.5 py-2.5 md:rounded-lg md:border md:px-3">
      <div className="flex-1 flex items-center gap-1 min-w-0 rounded-3xl bg-bg-canvas border border-border focus-within:border-border-strong px-4 py-1 min-h-[40px]">
        <TextareaAutosize
          ref={inputRef}
          className="flex-1 bg-transparent outline-none ts-sm text-fg-primary resize-none py-2"
          maxRows={6}
          minRows={1}
          value={text}
          disabled={isLoading}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("edit_msg_placeholder", { ns: "chat" })}
        />
      </div>
      {/* ✗ 與 ✓ 都靠右、同尺寸圓形底（w-9 h-9），中間 gap-3（12px）便於手指點擊 */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={close}
          className="w-9 h-9 flex-center rounded-full bg-bg-surface text-fg-subtle hover:bg-bg-hover active:bg-bg-hover transition-colors"
          title={t("action.cancel", { ns: "common" })}
        >
          <IconClose className="w-4 h-4 fill-current" />
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isLoading || !text.trim()}
          className="w-9 h-9 flex-center rounded-full bg-accent text-accent-on disabled:opacity-40 hover:bg-accent-hover active:bg-accent-pressed transition-colors"
          title={t("save", { ns: "chat" })}
        >
          <IconCheck className="w-4 h-4 fill-current" />
        </button>
      </div>
    </div>
  );
};

export default Editing;
