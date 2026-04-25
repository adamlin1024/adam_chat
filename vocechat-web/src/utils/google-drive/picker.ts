import { GOOGLE_API_KEY, GOOGLE_CLIENT_ID } from "./config";
import { loadGAPI } from "./loader";
import { requestAccessToken } from "./auth";

export type PickedFolder = {
  id: string;
  name: string;
};

/**
 * 開 Google Picker，讓使用者選一個 Drive 資料夾。
 * 取消選擇回傳 null。
 */
export async function pickFolder(): Promise<PickedFolder | null> {
  const token = await requestAccessToken();
  await loadGAPI(["picker"]);

  const google = window.google!;

  return new Promise<PickedFolder | null>((resolve, reject) => {
    try {
      const folderView = new google.picker.DocsView(google.picker.ViewId.FOLDERS)
        .setSelectFolderEnabled(true)
        .setMimeTypes("application/vnd.google-apps.folder")
        .setIncludeFolders(true)
        .setParent("root");

      const picker = new google.picker.PickerBuilder()
        .setOAuthToken(token.access_token)
        .setDeveloperKey(GOOGLE_API_KEY)
        .setAppId(GOOGLE_CLIENT_ID.split("-")[0]) // project number
        .addView(folderView)
        .setTitle("選擇要儲存的雲端資料夾")
        .setCallback((data) => {
          const action = data[google.picker.Response.ACTION];
          if (action === google.picker.Action.PICKED) {
            const docs = data[google.picker.Response.DOCUMENTS];
            const doc = docs?.[0];
            if (doc) {
              resolve({ id: doc.id, name: doc.name });
            } else {
              resolve(null);
            }
          } else if (action === google.picker.Action.CANCEL) {
            resolve(null);
          }
        })
        .build();
      picker.setVisible(true);
    } catch (err) {
      reject(err);
    }
  });
}
