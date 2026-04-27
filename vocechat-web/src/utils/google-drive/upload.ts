import { DriveFolderNotAccessibleError, requestAccessToken } from "./auth";

const UPLOAD_ENDPOINT =
  "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";

export type UploadResult = {
  id: string;
  name: string;
  webViewLink?: string;
  mimeType?: string;
};

/**
 * 上傳 Blob 到使用者指定的 Drive 資料夾。
 * 使用 multipart upload（適合 ≤5MB 的檔案；大檔請改 resumable）。
 */
export async function uploadToDrive(opts: {
  blob: Blob;
  fileName: string;
  folderId: string;
  mimeType?: string;
}): Promise<UploadResult> {
  const { blob, fileName, folderId, mimeType } = opts;
  const token = await requestAccessToken();

  const metadata = {
    name: fileName,
    parents: [folderId],
    ...(mimeType ? { mimeType } : {})
  };

  const boundary = "-------drive-upload-" + Math.random().toString(36).slice(2);
  const delim = `\r\n--${boundary}\r\n`;
  const closeDelim = `\r\n--${boundary}--`;

  const metaPart =
    delim +
    "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
    JSON.stringify(metadata);

  const filePart =
    delim +
    `Content-Type: ${mimeType || blob.type || "application/octet-stream"}\r\n` +
    "Content-Transfer-Encoding: base64\r\n\r\n" +
    (await blobToBase64(blob));

  const body = metaPart + filePart + closeDelim;

  const res = await fetch(
    UPLOAD_ENDPOINT + "&fields=id,name,webViewLink,mimeType",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        "Content-Type": `multipart/related; boundary=${boundary}`
      },
      body
    }
  );

  if (!res.ok) {
    const text = await res.text();
    // 404 + fileId parameter 通常是 folderId 找不到（drive.file scope 看不到非當前帳號建的檔案，
    // 或資料夾已被使用者手動刪除）。轉成 typed error 讓 UI 顯示精準提示。
    if (res.status === 404 && /fileId/.test(text) && /not[\s_]?[Ff]ound/.test(text)) {
      throw new DriveFolderNotAccessibleError(folderId);
    }
    throw new Error(`Drive upload failed: ${res.status} ${text}`);
  }

  return (await res.json()) as UploadResult;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // dataUrl: "data:<mime>;base64,<DATA>"
      const idx = result.indexOf("base64,");
      resolve(idx >= 0 ? result.slice(idx + 7) : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
