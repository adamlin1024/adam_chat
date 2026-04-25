// Minimal type declarations for Google Identity Services + Picker API.
// Only covers the surface we actually call.

interface GoogleTokenResponse {
  access_token: string;
  expires_in: string | number;
  scope: string;
  token_type: string;
  error?: string;
}

interface GoogleTokenClientConfig {
  client_id: string;
  scope: string;
  prompt?: "" | "consent" | "select_account" | "none";
  callback: (response: GoogleTokenResponse) => void;
  error_callback?: (err: { type?: string; message?: string }) => void;
}

interface GoogleTokenClient {
  requestAccessToken: (overrides?: { prompt?: "" | "consent" | "select_account" }) => void;
}

interface GooglePickerView {
  setSelectFolderEnabled: (v: boolean) => GooglePickerView;
  setMimeTypes: (types: string) => GooglePickerView;
  setIncludeFolders: (v: boolean) => GooglePickerView;
  setParent: (id: string) => GooglePickerView;
}

interface GooglePickerBuilder {
  setOAuthToken: (t: string) => GooglePickerBuilder;
  setDeveloperKey: (k: string) => GooglePickerBuilder;
  setAppId: (id: string) => GooglePickerBuilder;
  addView: (v: GooglePickerView) => GooglePickerBuilder;
  setTitle: (t: string) => GooglePickerBuilder;
  setCallback: (cb: (data: any) => void) => GooglePickerBuilder;
  build: () => { setVisible: (v: boolean) => void };
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (cfg: GoogleTokenClientConfig) => GoogleTokenClient;
          revoke: (token: string, done?: () => void) => void;
        };
      };
      picker: {
        ViewId: { FOLDERS: string };
        Action: { PICKED: string; CANCEL: string };
        Response: { ACTION: string; DOCUMENTS: string };
        DocsView: new (viewId: string) => GooglePickerView;
        PickerBuilder: new () => GooglePickerBuilder;
      };
    };
    gapi?: {
      load: (
        modules: string,
        opts: { callback: () => void; onerror?: () => void }
      ) => void;
    };
  }
}

export {};
