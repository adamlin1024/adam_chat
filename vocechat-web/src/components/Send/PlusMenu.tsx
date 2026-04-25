import { ChangeEvent, FC, useState, useId } from "react";
import * as Popover from "@radix-ui/react-popover";
import clsx from "clsx";

import { ChatContext } from "@/types/common";
import useUploadFile from "@/hooks/useUploadFile";
import IconPlus from "@/assets/icons/add.solid.svg";
import IconCamera from "@/assets/icons/camera.svg";
import IconImage from "@/assets/icons/picture.svg";
import IconFile from "@/assets/icons/folder.svg";
import IconMarkdown from "@/assets/icons/markdown.svg";

type Props = {
  context: ChatContext;
  to: number;
  isMarkdown: boolean;
  toggleMode: () => void;
};

// visually-hidden 樣式（不用 display:none，否則 iOS 對 hidden file input 觸發
// picker 時可能降級行為）
const VISUALLY_HIDDEN: React.CSSProperties = {
  position: "absolute",
  width: "1px",
  height: "1px",
  padding: 0,
  margin: "-1px",
  overflow: "hidden",
  clip: "rect(0,0,0,0)",
  whiteSpace: "nowrap",
  border: 0,
};

const PlusMenu: FC<Props> = ({ context, to, isMarkdown, toggleMode }) => {
  const [open, setOpen] = useState(false);
  const { addStageFile } = useUploadFile({ context, id: to });
  const reactId = useId();
  const cameraId = `plusmenu-camera-${reactId}`;
  const photoId = `plusmenu-photo-${reactId}`;
  const fileId = `plusmenu-file-${reactId}`;

  const handleUpload = (evt: ChangeEvent<HTMLInputElement>) => {
    if (!evt.target.files) return;
    const files = Array.from(evt.target.files);
    const filesData = files.map((file) => {
      const { size, type, name } = file;
      const url = URL.createObjectURL(file);
      return { size, type, name, url };
    });
    addStageFile(filesData);
    evt.target.value = "";
    setOpen(false);
  };

  // 用 <label htmlFor=...> 包住 menu item — iOS 會把 label 點擊直接關聯到
  // file input，比 JS .click() 觸發更穩，user gesture chain 不會斷，
  // PHPicker 比較容易直接開（不降級到 source sheet）。
  type Item =
    | { key: string; label: string; icon: React.ReactNode; htmlFor: string; active?: boolean }
    | { key: string; label: string; icon: React.ReactNode; onClick: () => void; active?: boolean };

  const items: Item[] = [
    {
      key: "camera",
      label: "拍照 / 錄影",
      icon: <IconCamera className="w-5 h-5 fill-current" />,
      htmlFor: cameraId,
    },
    {
      key: "photo",
      label: "相片",
      icon: <IconImage className="w-5 h-5 fill-current" />,
      htmlFor: photoId,
    },
    {
      key: "file",
      label: "檔案",
      icon: <IconFile className="w-5 h-5 fill-current" />,
      htmlFor: fileId,
    },
    {
      key: "markdown",
      label: "Markdown",
      icon: <IconMarkdown className="w-5 h-5 fill-current" />,
      onClick: () => {
        toggleMode();
        setOpen(false);
      },
      active: isMarkdown,
    },
  ];

  return (
    <>
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <button
            tabIndex={-1}
            onMouseDown={(e) => e.preventDefault()}
            className="shrink-0 w-8 h-8 flex-center rounded-full text-fg-subtle hover:text-fg-primary hover:bg-bg-elevated transition-colors"
          >
            <IconPlus className={clsx("w-5 h-5 fill-current transition-transform", open && "rotate-45")} />
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            side="top"
            align="start"
            alignOffset={0}
            sideOffset={8}
            className="z-[100] rounded-lg overflow-hidden shadow-xl bg-bg-elevated border border-border-subtle min-w-[160px]"
          >
            <ul className="flex flex-col py-1">
              {items.map((item) => {
                const cls = clsx(
                  "w-full flex items-center gap-3 px-3 py-2.5 ts-meta font-medium transition-colors cursor-pointer",
                  item.active
                    ? "text-accent bg-bg-surface"
                    : "text-fg-secondary hover:bg-bg-surface"
                );
                return (
                  <li key={item.key}>
                    {"htmlFor" in item ? (
                      // label 直接關聯 hidden file input，點 label 等於點 input，
                      // user gesture chain 不斷
                      <label htmlFor={item.htmlFor} className={cls}>
                        {item.icon}
                        <span>{item.label}</span>
                      </label>
                    ) : (
                      <button onClick={item.onClick} className={cls}>
                        {item.icon}
                        <span>{item.label}</span>
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

      {/*
        accept 用具體 MIME types 而不是 image/* 通配符。
        iOS Safari 對 image/* 一律跳「拍照 / 圖庫 / 檔案」三選一原生 sheet，
        改成明確列出常見格式，PHPicker 較有機會直接開圖庫不跳 sheet。
        capture 則維持只在「拍照 / 錄影」用，明確強制相機。
      */}
      <input
        id={cameraId}
        type="file"
        style={VISUALLY_HIDDEN}
        accept="image/jpeg,image/png,image/heic,image/heif,video/mp4,video/quicktime"
        capture="environment"
        onChange={handleUpload}
      />
      {/*
        相片：用最標準的 PHPicker invocation pattern（image/* + multiple）。
        iOS 14+ Safari 會走 PHPicker 直接開圖庫；PWA (WKWebView) 整合受限，
        但搭配 <label> 觸發（不靠 JS .click()）user gesture chain 較完整，
        較有機會直接走 PHPicker。
      */}
      <input
        id={photoId}
        type="file"
        style={VISUALLY_HIDDEN}
        accept="image/*"
        multiple
        onChange={handleUpload}
      />
      {/*
        檔案：明確排除照片相關 MIME，讓 iOS 只走檔案 picker（不跳圖庫選項）。
      */}
      <input
        id={fileId}
        type="file"
        style={VISUALLY_HIDDEN}
        accept="application/pdf,application/zip,application/x-zip-compressed,application/x-rar-compressed,application/x-7z-compressed,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,text/csv,text/markdown,application/json,application/xml,audio/mpeg,audio/wav,audio/mp4,audio/aac"
        multiple
        onChange={handleUpload}
      />
    </>
  );
};

export default PlusMenu;
