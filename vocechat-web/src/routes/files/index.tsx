import { useMemo, useState } from "react";
import clsx from "clsx";
import Tippy from "@tippyjs/react";
import BASE_URL from "@/app/config";
import { useAppSelector } from "@/app/store";
import FileBox from "@/components/FileBox";
import EmptyState from "@/components/EmptyState";
import FilterChannel from "./Filter/Channel";
import { useGetFilesQuery } from "@/app/services/server";
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
  const [fileType, setFileType] = useState("");
  const [gid, setGid] = useState<number | undefined>(undefined);
  const [channelMenuVisible, setChannelMenuVisible] = useState(false);
  const [typeMenuVisible, setTypeMenuVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null);
  const view = useAppSelector((store) => store.ui.fileListView, shallowEqual);
  const channelMap = useAppSelector((store) => store.channels.byId, shallowEqual);

  // 用非 lazy 版 + currentData：args 變或還在 refetch 時 currentData 一律 undefined，
  // 不會把上次的 stale 結果先閃一下（殭屍紀錄會破圖、紅字、再被覆蓋的根因）
  const queryArgs = useMemo(() => {
    const f: Record<string, unknown> = { page_size: 1000 };
    if (fileType) f.file_type = fileType;
    if (gid) f.gid = gid;
    return f;
  }, [fileType, gid]);
  const { currentData, isFetching } = useGetFilesQuery(queryArgs, {
    refetchOnMountOrArgChange: true
  });

  // 只要在 refetch 中、或還沒拿到 currentData，就不渲染——避免 stale 列表閃一下
  const rawFiles =
    isFetching || !currentData
      ? []
      : [...currentData.filter((item) => !item.expired)].sort(
          (a, b) => b.created_at - a.created_at
        );

  // 同一個 file_path（content）會被多則 message 共用（轉發 / 複製訊息），
  // 列表預設按 message 列出 → 一張圖顯示 N 次。
  // 這裡按 thumbnail || content 去重，保留最新那一筆，視覺乾淨。
  const files = useMemo(() => {
    const seen = new Map<string, typeof rawFiles[number]>();
    for (const f of rawFiles) {
      const key = (f.thumbnail || f.content) as string;
      const existing = seen.get(key);
      if (!existing || (f.created_at ?? 0) > (existing.created_at ?? 0)) {
        seen.set(key, f);
      }
    }
    return Array.from(seen.values());
  }, [rawFiles]);

  const selectedTypeLabel = typeFilters.find((f) => f.type === fileType)?.title ?? "全部";

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
                  select={gid ?? 0}
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
                    : "text-fg-subtle border border-border-subtle hover:bg-bg-hover"
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
                    : "text-fg-subtle border border-border-subtle hover:bg-bg-hover"
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
                view !== "grid" ? "bg-bg-surface" : "hover:bg-bg-hover"
              )}
              onClick={() => view !== "item" && dispatch(updateFileListView("item"))}
            >
              <IconList className={view !== "grid" ? "fill-accent" : "fill-fg-subtle"} />
            </li>
            <li
              className={clsx(
                "cursor-pointer p-1.5 flex-center border-l border-border-subtle transition-colors",
                view === "grid" ? "bg-bg-surface" : "hover:bg-bg-hover"
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
            files.length === 0
              ? "flex items-center justify-center"
              : view === "item"
                ? "flex flex-col gap-3"
                : "grid gap-x-3 gap-y-1.5 auto-rows-[281px] grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
          )}
        >
          {files.length === 0 && !isFetching && (
            <EmptyState
              icon={<IconUnknown className="w-7 h-7" />}
              title="沒有檔案"
              desc="這個頻道 / 篩選條件下還沒有任何上傳的檔案"
            />
          )}
          {files.length === 0 && isFetching && (
            <div className="text-sm text-fg-muted">載入中…</div>
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
                mid={mid}
                file_type={content_type}
                content={url}
                created_at={created_at}
                from_uid={from_uid}
                size={size}
                name={name}
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
