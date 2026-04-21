import { ChangeEvent, FC, useRef } from "react";
import { useTranslation } from "react-i18next";

import { ChatContext } from "@/types/common";
import useUploadFile from "@/hooks/useUploadFile";
import AddIcon from "@/assets/icons/add.solid.svg";
import ExitFullscreenIcon from "@/assets/icons/fullscreen.exit.svg";
import FullscreenIcon from "@/assets/icons/fullscreen.svg";
import MarkdownIcon from "@/assets/icons/markdown.svg";
import SendIcon from "@/assets/icons/send.svg";
import Tooltip from "../Tooltip";

type Props = {
  sendMessages: () => void;
  toggleMarkdownFullscreen: () => void;
  fullscreen: boolean;
  toggleMode: () => void;
  mode: "markdown" | "text";
  to: number;
  context: ChatContext;
  sendVisible: boolean;
};
const Toolbar: FC<Props> = ({
  sendMessages,
  sendVisible,
  toggleMarkdownFullscreen,
  fullscreen,
  toggleMode,
  mode,
  to,
  context
}) => {
  const { t } = useTranslation();
  const { addStageFile } = useUploadFile({ context, id: to });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleUpload = (evt: ChangeEvent<HTMLInputElement>) => {
    if (!evt.target.files) return;
    const files = Array.from(evt.target.files);
    const filesData = files.map((file) => {
      const { size, type, name } = file;
      const url = URL.createObjectURL(file);
      return { size, type, name, url };
    });
    addStageFile(filesData);
    // todo: check code logic
    // @ts-ignore
    fileInputRef.current.value = null;
    // @ts-ignore
    fileInputRef.current.value = "";
    // setFiles([...evt.target.files]);
  };

  const isMarkdown = mode == "markdown";
  return (
    <div className={`flex items-center gap-2`}>
      <Tooltip placement="top" tip="Markdown">
        <MarkdownIcon
          className={`w-4 h-4 cursor-pointer ${isMarkdown ? "fill-accent" : "fill-fg-subtle hover:fill-fg-secondary"} transition-colors`}
          onClick={toggleMode}
        />
      </Tooltip>
      {isMarkdown &&
        (fullscreen ? (
          <Tooltip placement="top" tip="Exit Fullscreen">
            <ExitFullscreenIcon
              onClick={toggleMarkdownFullscreen}
              className="w-4 h-4 cursor-pointer fill-fg-subtle hover:fill-fg-secondary transition-colors"
            />
          </Tooltip>
        ) : (
          <Tooltip placement="top" tip="Fullscreen">
            <FullscreenIcon onClick={toggleMarkdownFullscreen} className="w-4 h-4 cursor-pointer fill-fg-subtle hover:fill-fg-secondary transition-colors" />
          </Tooltip>
        ))}
      {!isMarkdown && (
        <>
          <Tooltip placement="top" tip={t("action.upload")}>
            <div className="cursor-pointer relative w-[22px] h-[22px] flex items-center justify-center text-fg-subtle hover:text-fg-secondary transition-colors">
              <AddIcon className="w-4 h-4 fill-current" />
              <label
                htmlFor="file"
                className="cursor-pointer absolute left-0 top-0 w-full h-full opacity-0"
              >
                <input
                  className="hidden"
                  size={24}
                  ref={fileInputRef}
                  multiple={true}
                  onChange={handleUpload}
                  type="file"
                  name="file"
                  id="file"
                  tabIndex={-1}
                />
              </label>
            </div>
          </Tooltip>
          <button
            tabIndex={-1}
            onClick={sendMessages}
            className={`rounded-sm px-3 py-[5px] font-mono text-[12px] font-bold whitespace-nowrap transition-colors ${
              sendVisible
                ? "bg-accent text-accent-on cursor-pointer animate-zoomIn"
                : "bg-bg-surface text-fg-disabled cursor-default"
            }`}
          >
            SEND ↵
          </button>
        </>
      )}
    </div>
  );
};
export default Toolbar;
