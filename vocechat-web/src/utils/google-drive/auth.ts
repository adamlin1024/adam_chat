import { GOOGLE_CLIENT_ID, GOOGLE_DRIVE_SCOPE } from "./config";
import { loadGIS } from "./loader";

const TOKEN_KEY = "google_drive_token";
// token 過期前提早多少 ms 嘗試 silent refresh（5 分鐘）
const RENEW_BEFORE_MS = 5 * 60 * 1000;

export type DriveToken = {
  access_token: string;
  expires_at: number; // ms timestamp
  scope: string;
};

let renewTimer: ReturnType<typeof setTimeout> | null = null;

export function getStoredToken(): DriveToken | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    const t = JSON.parse(raw) as DriveToken;
    if (!t.access_token || !t.expires_at) return null;
    if (Date.now() >= t.expires_at - 30_000) return null; // 30s 緩衝
    return t;
  } catch {
    return null;
  }
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
  if (renewTimer) {
    clearTimeout(renewTimer);
    renewTimer = null;
  }
}

function storeToken(t: DriveToken) {
  localStorage.setItem(TOKEN_KEY, JSON.stringify(t));
  scheduleSilentRenew(t);
}

/**
 * Token 過期前 N 分鐘自動 silent refresh。
 * 失敗（例如使用者已登出 Google）就靜默處理，下次使用者操作時才會彈窗。
 */
function scheduleSilentRenew(t: DriveToken) {
  if (renewTimer) clearTimeout(renewTimer);
  const delay = t.expires_at - Date.now() - RENEW_BEFORE_MS;
  if (delay <= 0) return;
  renewTimer = setTimeout(() => {
    silentRefresh().catch(() => {
      // 靜默失敗 — 下次操作會走完整 OAuth flow
    });
  }, delay);
}

/** 不彈窗、強制重拿一份 token（前提是使用者仍登入 Google + 已授權過） */
async function silentRefresh(): Promise<void> {
  await loadGIS();
  const google = window.google!;
  return new Promise<void>((resolve, reject) => {
    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: GOOGLE_DRIVE_SCOPE,
      prompt: "", // 關鍵：空字串 = 已授權則不彈
      callback: (response) => {
        if (response.error) {
          reject(new Error(response.error));
          return;
        }
        const expiresIn = Number(response.expires_in ?? 3600);
        const t: DriveToken = {
          access_token: response.access_token,
          expires_at: Date.now() + expiresIn * 1000,
          scope: response.scope ?? GOOGLE_DRIVE_SCOPE
        };
        // 直接寫 localStorage（避免遞迴呼叫 storeToken/scheduleSilentRenew 兩次）
        localStorage.setItem(TOKEN_KEY, JSON.stringify(t));
        scheduleSilentRenew(t);
        resolve();
      },
      error_callback: (err) => reject(new Error(err?.message || "silent refresh failed"))
    });
    tokenClient.requestAccessToken({ prompt: "" });
  });
}

/** App 載入時呼叫一次：若已有有效 token，安排自動續約 */
export function initDriveAutoRenew() {
  const t = getStoredToken();
  if (t) scheduleSilentRenew(t);
}

/**
 * 觸發 Google OAuth popup，取得 access token。
 * 若已有有效 token，直接回傳；否則彈窗讓使用者授權。
 */
export async function requestAccessToken(opts: { prompt?: "" | "consent" } = {}): Promise<DriveToken> {
  const cached = getStoredToken();
  if (cached) return cached;

  await loadGIS();
  const google = window.google!;

  return new Promise<DriveToken>((resolve, reject) => {
    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: GOOGLE_DRIVE_SCOPE,
      prompt: opts.prompt ?? "",
      callback: (response) => {
        if (response.error) {
          reject(new Error(response.error));
          return;
        }
        const expiresIn = Number(response.expires_in ?? 3600);
        const t: DriveToken = {
          access_token: response.access_token,
          expires_at: Date.now() + expiresIn * 1000,
          scope: response.scope ?? GOOGLE_DRIVE_SCOPE
        };
        storeToken(t);
        resolve(t);
      },
      error_callback: (err) => reject(new Error(err?.message || "OAuth failed"))
    });
    tokenClient.requestAccessToken();
  });
}

export async function revokeAccess(): Promise<void> {
  const t = getStoredToken();
  clearStoredToken();
  if (!t) return;
  await loadGIS();
  const google = window.google!;
  return new Promise<void>((resolve) => {
    google.accounts.oauth2.revoke(t.access_token, () => resolve());
  });
}
