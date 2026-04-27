import { GOOGLE_CLIENT_ID, GOOGLE_DRIVE_SCOPE } from "./config";
import { loadGIS } from "./loader";

const TOKEN_KEY = "google_drive_token";
const BOUND_USER_KEY = "google_drive_bound_user";
// token 過期前提早多少 ms 嘗試 silent refresh（5 分鐘）
const RENEW_BEFORE_MS = 5 * 60 * 1000;

export type DriveToken = {
  access_token: string;
  expires_at: number; // ms timestamp
  scope: string;
};

export type BoundUser = {
  permissionId: string;
  displayName: string;
};

/**
 * 帳號不一致：使用者綁定的是 A，但 popup 中選了 B。
 * 上層 catch 後可顯示 i18n 提示讓使用者重試或切換。
 */
export class DriveAccountMismatchError extends Error {
  readonly code = "DRIVE_ACCOUNT_MISMATCH" as const;
  readonly boundName: string;
  readonly pickedName: string;
  constructor(boundName: string, pickedName: string) {
    super(`Drive account mismatch: bound "${boundName}", picked "${pickedName}"`);
    this.name = "DriveAccountMismatchError";
    this.boundName = boundName;
    this.pickedName = pickedName;
  }
}

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

/**
 * 是否有「曾經授權過」的 raw 資料（不論是否過期）。
 * 用來判斷 UI 顯示已 / 未授權 — 純 JS 前端在 Chrome 第三方 cookies 限制下
 * 沒有真正的 silent refresh 能力（GIS popup 在無 user gesture 環境會被擋），
 * 所以只要 raw 還在就視為「已連動」，等使用者操作 Drive 時再由 user gesture
 * 觸發 popup 續約（grant 還在的話通常一閃即逝）。
 */
export function hasRawStoredToken(): boolean {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    if (!raw) return false;
    const t = JSON.parse(raw) as Partial<DriveToken>;
    return Boolean(t.access_token && t.expires_at);
  } catch {
    return false;
  }
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(BOUND_USER_KEY);
  if (renewTimer) {
    clearTimeout(renewTimer);
    renewTimer = null;
  }
}

function getBoundUser(): BoundUser | null {
  try {
    const raw = localStorage.getItem(BOUND_USER_KEY);
    if (!raw) return null;
    const u = JSON.parse(raw) as Partial<BoundUser>;
    if (!u.permissionId || !u.displayName) return null;
    return u as BoundUser;
  } catch {
    return null;
  }
}

function setBoundUser(u: BoundUser) {
  localStorage.setItem(BOUND_USER_KEY, JSON.stringify(u));
}

/** 用 access token 拉一次 Drive about，拿目前帳號的 permissionId + displayName */
async function fetchDriveUser(accessToken: string): Promise<BoundUser> {
  const res = await fetch(
    "https://www.googleapis.com/drive/v3/about?fields=user(permissionId,displayName)",
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) throw new Error(`fetch drive user failed: ${res.status}`);
  const json = (await res.json()) as { user?: Partial<BoundUser> };
  if (!json.user?.permissionId || !json.user?.displayName) {
    throw new Error("drive about response missing user fields");
  }
  return {
    permissionId: json.user.permissionId,
    displayName: json.user.displayName
  };
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
export async function silentRefresh(): Promise<void> {
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

/**
 * App 載入時呼叫一次：若已有有效 token，安排自動續約。
 *
 * 不在這裡嘗試「raw 還在但過期」的 silent refresh —— GIS 在沒有 user gesture
 * 的環境裡 popup 會被瀏覽器擋掉（Chrome 第三方 cookies 政策也讓 hidden iframe
 * silent flow 失效），徒增 console error 沒有幫助。
 * 真正的續約由 `requestAccessToken` 在使用者點按鈕時（user gesture）觸發。
 */
export function initDriveAutoRenew() {
  const t = getStoredToken();
  if (t) scheduleSilentRenew(t);
}

/**
 * 觸發 Google OAuth popup，取得 access token。
 * 若已有有效 token，直接回傳；否則彈窗讓使用者授權。
 *
 * 帳號驗證：popup 後使用者可能選了「不同 Google 帳號」（例如綁定 A、選了 B）。
 * callback 拿到新 token 後會先打 Drive about 拿 permissionId，跟綁定使用者比對：
 *   - 不一致 → 不存新 token、reject DriveAccountMismatchError
 *   - 一致或第一次 → 存 token + 更新 bound_user
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
      callback: async (response) => {
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
        try {
          const newUser = await fetchDriveUser(t.access_token);
          const bound = getBoundUser();
          if (bound && bound.permissionId !== newUser.permissionId) {
            // 帳號不一致 — 不存新 token，讓使用者重試
            reject(new DriveAccountMismatchError(bound.displayName, newUser.displayName));
            return;
          }
          // 第一次或一致 → 寫 / 更新 bound_user
          setBoundUser(newUser);
        } catch (e) {
          // 拿不到使用者資訊（API 失敗等）— 不擋正常流程，但記錄到 console
          console.warn("[Drive] fetch user failed, skip identity check", e);
        }
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
