import { ChangeEvent, FC, useRef, useState } from "react";
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

const PlusMenu: FC<Props> = ({ context, to, isMarkdown, toggleMode }) => {
  const [open, setOpen] = useState(false);
  const { addStageFile } = useUploadFile({ context, id: to });
  const cameraRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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

  const openPicker = (ref: React.RefObject<HTMLInputElement>) => {
    ref.current?.click();
  };

  const items = [
    {
      key: "camera",
      label: "拍照 / 錄影",
      icon: <IconCamera className="w-5 h-5 fill-current" />,
      onClick: () => openPicker(cameraRef),
      active: false,
    },
    {
      key: "photo",
      label: "相片",
      icon: <IconImage className="w-5 h-5 fill-current" />,
      onClick: () => openPicker(photoRef),
      active: false,
    },
    {
      key: "file",
      label: "檔案",
      icon: <IconFile className="w-5 h-5 fill-current" />,
      onClick: () => openPicker(fileRef),
      active: false,
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
              {items.map(({ key, label, icon, onClick, active }) => (
                <li key={key}>
                  <button
                    onClick={onClick}
                    className={clsx(
                      "w-full flex items-center gap-3 px-3 py-2.5 ts-meta font-medium transition-colors",
                      active
                        ? "text-accent bg-bg-surface"
                        : "text-fg-secondary hover:bg-bg-surface"
                    )}
                  >
                    {icon}
                    <span>{label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

      <input
        ref={cameraRef}
        type="file"
        className="hidden"
        accept="image/*,video/*"
        capture="environment"
        onChange={handleUpload}
      />
      <input
        ref={photoRef}
        type="file"
        className="hidden"
        accept="image/*,video/*"
        multiple
        onChange={handleUpload}
      />
      <input
        ref={fileRef}
        type="file"
        className="hidden"
        multiple
        onChange={handleUpload}
      />
    </>
  );
};

export default PlusMenu;
