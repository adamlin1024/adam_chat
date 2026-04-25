import { requestAccessToken } from "./auth";

const DRIVE_API_BASE = "https://www.googleapis.com";

/**
 * 帶 OAuth token 的 Drive API 請求。回傳 JSON。
 */
export async function driveFetch<T = any>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const token = await requestAccessToken();
  const url = path.startsWith("http") ? path : `${DRIVE_API_BASE}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      ...(init.headers || {})
    }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Drive API ${res.status}: ${text}`);
  }
  // 204 No Content（DELETE 成功時）→ 回傳 null
  if (res.status === 204) return null as unknown as T;
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    return (await res.json()) as T;
  }
  return (await res.text()) as unknown as T;
}

/** 刪除 Drive 上指定的檔案（必須是本 App 上傳的，drive.file scope 限制） */
export async function deleteDriveFile(fileId: string): Promise<void> {
  await driveFetch(`/drive/v3/files/${fileId}`, { method: "DELETE" });
}
