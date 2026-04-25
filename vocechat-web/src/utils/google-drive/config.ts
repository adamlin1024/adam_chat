// 這兩個值是 public-safe：
// - CLIENT_ID 在 OAuth flow 中本來就會出現在 URL，是公開識別字
// - API_KEY 受 GCP 設定的 HTTP referrer 限制，且只允許呼叫 Google Picker API
// 所以直接寫進原始碼沒有安全疑慮。
export const GOOGLE_CLIENT_ID =
  "671184873537-h5kf2nkd2ch49tthc0oqsg2kc973jljv.apps.googleusercontent.com";
export const GOOGLE_API_KEY = "AIzaSyAHVtSHb6eUY_IdQgJOLf3JfvB1KGvAgIc";

// drive.file: 只能讀寫由本 App 建立或開啟的檔案（最小權限，不需 verification）
export const GOOGLE_DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";

export const GIS_SCRIPT_URL = "https://accounts.google.com/gsi/client";
export const GAPI_SCRIPT_URL = "https://apis.google.com/js/api.js";

export function isDriveConfigured(): boolean {
  return Boolean(GOOGLE_CLIENT_ID && GOOGLE_API_KEY);
}
