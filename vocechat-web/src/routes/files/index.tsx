// @ts-nocheck
import { useEffect, useState } from "react";
import clsx from "clsx";
import Tippy from "@tippyjs/react";
import BASE_URL from "@/app/config";
import { useAppSelector } from "@/app/store";
import FileBox from "@/components/FileBox";
import FilterChannel from "./Filter/Channel";
import { useLazyGetFilesQuery, useLazyDeleteSingleFileQuery } from "@/app/services/server";
import toast from "react-hot-toast";
import { shallowEqual, useDispatch } from "react-redux";
import { updateFileListView } from "@/app/slices/ui";
import ChannelIcon from "@/components/ChannelIcon";
import ImagePreviewModal from "@/components/ImagePreviewModal";

import IconUnknown from "@/assets/icons/file.unknown.svg";
import IconImage from "@/assets/icons/file.image.svg";
import IconVideo from "@/assets/icons/file.video.svg";
import IconAudio from "@/assets/icons/file.audio.svg";
import IconDoc from "@/assets/icons/file.doc.svg";
import IconPdf from "@/assets/icons/file.pdf.svg";
import IconList from "@/assets/icons/file.list.svg";
import IconGrid from "@/assets/icons/file.grid.svg";
import ArrowDown from "@/assets/icons/arrow.down.svg";
import CheckSign from "@/assets/icons/check.sign.svg";

const typeFilters = [
  { icon: <IconUnknown className="w-[15px] h-5" />, title: "全部", type: "" },
  { icon: <IconImage className="w-[15px] h-5" />, title: "圖片", type: "Image" },
  { icon: <IconVideo className="w-[15px] h-5" />, title: "影片", type: "Video" },
  { icon: <IconAudio className="w-[15px] h-5" />, title: "音訊", type: "Audio" },
  { icon: <IconDoc className="w-[15px] h-5" />, title: "文件", type: "Doc" },
  { icon: <IconPdf className="w-[15px] h-5" />, title: "PDF", type: "PDF" },
];

function Files() {
  const dispatch = useDispatch();
  const [getFiles, { data }] = useLazyGetFilesQuery();
  const [deleteSingleFile] = useLazyDeleteSingleFileQuery();
  const [fileType, setFileType] = useState("");
  const [gid, setGid] = useState<number | undefined>(undefined);
  const [channelMenuVisible, setChannelMenuVisible] = useState(false);
  const [typeMenuVisible, setTypeMenuVisible] = useState(false);
  const [localDeleted, setLocalDeleted] = useState<Set<number>>(new Set());
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null);
  const view = useAppSelector((store) => store.ui.fileListView, shallowEqual);
  const channelMap = useAppSelector((store) => store.channels.byId, shallowEqual);

  useEffect(() => {
    const f: Record<string, unknown> = { page_size: 1000 };
    if (fileType) f.file_type = fileType;
    if (gid) f.gid = gid;
    getFiles(f);
  }, [fileType, gid]);

  if (!data) return null;

  const files = [...data.filter((item) => !item.expired && !localDeleted.has(item.mid))].sort(
    (a, b) => b.created_at - a.created_at
  );

  const selectedTypeLabel = typeFilters.find((f) => f.type === fileType)?.title ?? "全部";

  const handleDelete = async (mid: number, file_path: string, thumbnail_path?: string) => {
    setLocalDeleted((prev) => new Set(prev).add(mid));
    try {
      const res = await deleteSingleFile(file_path);
      if (thumbnail_path && thumbnail_path !== file_path) {
        await deleteSingleFile(thumbnail_path);
      }
      if ("error" in res && res.error) {
        console.error("deleteSingleFile error", res.error);
        toast.error("刪除失敗，伺服器不支援單檔刪除");
        setLocalDeleted((prev) => {
          const next = new Set(prev);
          next.delete(mid);
          return next;
        });
        return;
      }
    } catch (e) {
      console.error(e);
    }
    const f: Record<string, unknown> = { page_size: 1000 };
    if (fileType) f.file_type = fileType;
    if (gid) f.gid = gid;
    getFiles(f, false);
  };

  return (
    <div className="h-full flex overflow-hidden bg-bg-canvas md:mt-2 md:mr-6 md:mb-2.5 md:rounded-lg md:border md:border-border-subtle">
      {/* Content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header bar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border-subtle shrink-0">
          <div className="flex items-center gap-2">
            {/* Channel filter */}
            <Tippy
              interactive
              visible={channelMenuVisible}
              onClickOutside={() => setChannelMenuVisible(false)}
              placement="bottom-start"
              popperOptions={{ strategy: "fixed" }}
              content={
                <FilterChannel
                  select={gid}
                  updateFilter={({ gid: g }) => {
                    setGid(g);
                    setChannelMenuVisible(false);
                  }}
                />
              }
            >
              <button
                onClick={() => setChannelMenuVisible((v) => !v)}
                className={clsx(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors",
                  gid
                    ? "bg-bg-surface shadow-inset-hairline text-fg-primary"
                    : "text-fg-subtle border border-border-subtle hover:bg-[#0f1014]"
                )}
              >
                <ChannelIcon
                  personal={gid ? !channelMap[gid]?.is_public : false}
                  className="[&>svg]:w-3.5 [&>svg]:h-3.5 text-fg-subtle"
                />
                <span className="max-w-[120px] truncate">
                  {gid && channelMap[gid] ? channelMap[gid].name : "頻道"}
                </span>
                <ArrowDown className="w-3 h-3 shrink-0 stroke-current fill-none" />
              </button>
            </Tippy>

            {/* File type filter */}
            <Tippy
              interactive
              visible={typeMenuVisible}
              onClickOutside={() => setTypeMenuVisible(false)}
              placement="bottom-start"
              popperOptions={{ strategy: "fixed" }}
              content={
                <div className="rounded-lg bg-bg-elevated border border-border-subtle shadow-lg overflow-auto max-h-[360px] min-w-[140px]">
                  <ul className="flex flex-col py-1">
                    {typeFilters.map(({ title, type }) => (
                      <li
                        key={type}
                        className="relative cursor-pointer flex items-center gap-2.5 px-3 py-2.5 hover:bg-bg-surface transition-colors"
                        onClick={() => {
                          setFileType(type);
                          setTypeMenuVisible(false);
                        }}
                      >
                        <span className="text-fg-secondary font-medium ts-meta flex-1">{title}</span>
                        {fileType === type && <CheckSign className="fill-accent" />}
                      </li>
                    ))}
                  </ul>
                </div>
              }
            >
              <button
                onClick={() => setTypeMenuVisible((v) => !v)}
                className={clsx(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors",
                  fileType
                    ? "bg-bg-surface shadow-inset-hairline text-fg-primary"
                    : "text-fg-subtle border border-border-subtle hover:bg-[#0f1014]"
                )}
              >
                <span>{selectedTypeLabel}</span>
                <ArrowDown className="w-3 h-3 shrink-0 stroke-current fill-none" />
              </button>
            </Tippy>
          </div>

          {/* View toggle */}
          <ul className="flex items-center border border-border-subtle rounded-md overflow-hidden">
            <li
              className={clsx(
                "cursor-pointer p-1.5 flex-center transition-colors",
                view !== "grid" ? "bg-bg-surface" : "hover:bg-[#0f1014]"
              )}
              onClick={() => view !== "item" && dispatch(updateFileListView("item"))}
            >
              <IconList className={view !== "grid" ? "fill-accent" : "fill-fg-subtle"} />
            </li>
            <li
              className={clsx(
                "cursor-pointer p-1.5 flex-center border-l border-border-subtle transition-colors",
                view === "grid" ? "bg-bg-surface" : "hover:bg-[#0f1014]"
              )}
              onClick={() => view !== "grid" && dispatch(updateFileListView("grid"))}
            >
              <IconGrid className={view === "grid" ? "fill-accent" : "fill-fg-subtle"} />
            </li>
          </ul>
        </div>

        {/* File list */}
        <div
          className={clsx(
            "flex-1 overflow-y-auto no-scrollbar p-4 pb-[80px] md:pb-4",
            view === "item" ? "flex flex-col gap-3" : "grid gap-3 grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
          )}
        >
          {files.length === 0 && (
            <div className="col-span-full flex items-center justify-center py-16 text-fg-disabled text-sm">
              沒有檔案
            </div>
          )}
          {files.map((file) => {
            const { mid, thumbnail, content, created_at, from_uid, properties } = file;
            const { name, content_type, size } = properties ? JSON.parse(properties) : {};
            const url = `${BASE_URL}/resource/file?file_path=${encodeURIComponent(
              thumbnail || content
            )}`;
            const isImage = /^image/gi.test(content_type);
            return (
              <FileBox
                preview={view === "grid"}
                flex={view === "item"}
                key={mid}
                file_type={content_type}
                content={url}
                created_at={created_at}
                from_uid={from_uid}
                size={size}
                name={name}
                mid={mid}
                onDelete={view === "grid" ? () => handleDelete(mid, content, thumbnail) : undefined}
                onImageClick={isImage && view === "grid" ? () => setPreviewImage({ url, name }) : undefined}
              />
            );
          })}
        </div>
      </div>

      {previewImage && (
        <ImagePreviewModal
          data={{ originUrl: previewImage.url, name: previewImage.name }}
          closeModal={() => setPreviewImage(null)}
        />
      )}
    </div>
  );
}

export default Files;
