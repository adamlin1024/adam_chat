import { FC, ReactElement, useEffect } from "react";
import clsx from "clsx";

import { useAppSelector } from "@/app/store";
import { formatBytes, fromNowTime, getFileIcon } from "@/utils";
import useExpiredResMap from "@/hooks/useExpiredResMap";
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

  // 不用 /g 旗標 —— 重複 .test() 會記住 lastIndex 造成 alternating true/false 的詭異行為。
  // 不需要 case-insensitive 的 anchor 搜尋也不該用 /i 配 ^（content_type 來源都是
  // 標準小寫 mime），但保留 /i 作為防禦。
  const checks = {
    image: /^image/i,
    audio: /^audio/i,
    video: /^video/i,
    code: /(json|javascript|java|rb|c|php|xml|css|html)$/i,
    doc: /^text/i,
    pdf: /\/pdf$/i,
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
  const { isExpired, isValidated, setExpired, setValidated } = useExpiredResMap();
  const icon = getFileIcon(file_type, name, "icon w-9 h-12");

  // 上層一處統一偵測檔案是否還存在 — 不論 image / video / pdf / zip / 任何 mime 都
  // 走同一條路：HEAD 探測 → 404 標 expired → return null（卡片消失）/ 200 標 validated
  // → 後續永不再探測。preview 子元件不需各自處理 404，因為這裡已經先擋掉了。
  useEffect(() => {
    if (!content) return;
    if (isExpired(content) || isValidated(content)) return;
    let cancelled = false;
    fetch(content, { method: "HEAD" })
      .then((r) => {
        if (cancelled) return;
        if (r.ok) {
          setValidated(content);
        } else {
          setExpired(content);
        }
      })
      .catch(() => {
        // 網路斷線 / CORS 錯誤 — 不要當 404 處理（避免暫時性錯誤永久標 expired），
        // 留待下次再探測
      });
    return () => {
      cancelled = true;
    };
  }, [content, isExpired, isValidated, setExpired, setValidated]);

  if (!content) return null;
  if (isExpired(content)) return null;

  const previewContent = renderPreview({ file_type, content, name });
  const withPreview = preview && previewContent;
  const isImage = /^image/i.test(file_type);

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
