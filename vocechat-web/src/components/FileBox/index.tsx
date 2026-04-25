import { FC, ReactElement } from "react";
import clsx from "clsx";

import { useAppSelector } from "@/app/store";
import { formatBytes, fromNowTime, getFileIcon } from "@/utils";
import {
  AudioPreview,
  CodePreview,
  DocPreview,
  ImagePreview,
  PdfPreview,
  VideoPreview,
} from "./preview";
import { shallowEqual } from "react-redux";
import FileActionBar from "../FileActionBar";

interface Data {
  file_type: string;
  name: string;
  content: string;
}

const renderPreview = (data: Data) => {
  const { file_type, name = "", content } = data;
  let preview: null | ReactElement = null;

  const checks = {
    image: /^image/gi,
    audio: /^audio/gi,
    video: /^video/gi,
    code: /(json|javascript|java|rb|c|php|xml|css|html)$/gi,
    doc: /^text/gi,
    pdf: /\/pdf$/gi,
  };
  const _arr = name.split(".");
  const _type = file_type || _arr[_arr.length - 1];
  switch (true) {
    case checks.image.test(_type):
      {
        preview = <ImagePreview url={content} />;
      }
      break;
    case checks.pdf.test(_type):
      preview = <PdfPreview url={content} />;
      break;
    case checks.code.test(_type):
      preview = <CodePreview url={content} />;
      break;
    case checks.doc.test(_type):
      preview = <DocPreview url={content} />;
      break;
    case checks.audio.test(_type):
      preview = <AudioPreview url={content} />;
      break;
    case checks.video.test(_type):
      preview = <VideoPreview url={content} />;
      break;
  }
  return preview;
};

interface Props {
  preview?: boolean;
  flex: boolean;
  file_type: string;
  name: string;
  size: number;
  created_at: number;
  from_uid: number;
  content: string;
  /** 訊息 mid，用於收藏 */
  mid?: number;
  onImageClick?: () => void;
}

const FileBox: FC<Props> = ({
  preview,
  flex,
  file_type,
  name,
  size,
  created_at,
  from_uid,
  content,
  mid,
  onImageClick,
}) => {
  const fromUser = useAppSelector((store) => store.users.byId[from_uid], shallowEqual);
  const icon = getFileIcon(file_type, name, "icon w-9 h-12");

  if (!content) return null;

  const previewContent = renderPreview({ file_type, content, name });
  const withPreview = preview && previewContent;
  const isImage = /^image/gi.test(file_type);

  return (
    <div
      className={clsx(
        `rounded-md border border-border bg-bg-surface`,
        flex ? "w-full max-w-3xl" : "w-full md:w-[370px]",
        withPreview ? "relative overflow-hidden h-[281px]" : "h-auto",
        file_type.startsWith("audio") && !withPreview && "h-[125px]"
      )}
    >
      {/* Info row */}
      <div className="w-full px-3 pt-2.5 pb-1.5 flex items-start gap-2.5">
        <div className="shrink-0">{icon}</div>
        <div className="flex-1 flex flex-col gap-0.5 min-w-0">
          <span className="font-semibold text-sm text-fg-primary truncate">{name}</span>
          <em className="text-xs text-fg-subtle flex flex-wrap gap-x-3 gap-y-0.5 not-italic">
            <span>{formatBytes(size)}</span>
            <span>{fromNowTime(created_at)}</span>
            <span>
              by{" "}
              <strong className="font-bold text-fg-secondary">
                {fromUser?.name || "Deleted User"}
              </strong>
            </span>
          </em>
        </div>
      </div>

      {/* Action bar */}
      <div className="w-full px-2 pb-1.5 border-t border-border-subtle">
        <FileActionBar
          mid={mid}
          url={content}
          fileName={name}
          mimeType={file_type}
          className="pt-1.5"
        />
      </div>

      {withPreview && (
        <div
          className={clsx(
            "border-t border-border-subtle overflow-hidden",
            isImage && onImageClick && "cursor-pointer"
          )}
          style={{ height: "calc(100% - 100px)" }}
          onClick={isImage && onImageClick ? onImageClick : undefined}
        >
          {previewContent}
        </div>
      )}
    </div>
  );
};

export default FileBox;
