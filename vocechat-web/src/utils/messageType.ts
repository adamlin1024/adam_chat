import { ContentTypes } from "@/app/config";

const SAVABLE_TYPES = new Set<string>([
  ContentTypes.file,
  ContentTypes.audio,
  ContentTypes.archive
]);

/** 判斷該訊息是否屬於「檔案類」（可下載 / 可儲存到雲端） */
export function isMessageSavable(content_type?: string): boolean {
  if (!content_type) return false;
  return SAVABLE_TYPES.has(content_type);
}

/**
 * 把檔案 URL 標準化成穩定的 fileKey。
 * 跨環境（dev/prod）BASE_URL 可能不同，但 file_path 是後端的相對路徑，穩定唯一。
 * - 若 URL 含 `?file_path=xxx`，回 `file_path` 的值
 * - 否則回原 URL
 */
export function fileKeyFromUrl(url: string): string {
  if (!url) return "";
  try {
    const u = new URL(url, "http://placeholder");
    const fp = u.searchParams.get("file_path");
    if (fp) return fp;
  } catch {
    /* fall through */
  }
  return url;
}
