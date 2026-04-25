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
  // Some endpoints return text/plain when alt=media for JSON files
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    return (await res.json()) as T;
  }
  return (await res.text()) as unknown as T;
}
