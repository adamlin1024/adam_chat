---
name: add-sticker
description: 將下載的 LINE 貼圖包（ZIP 或已解壓資料夾）自動安裝到 Adam_chat 專案。從桌面、下載、Adam_chat/sticker/ 三個位置搜尋，最新的優先。
---

# add-sticker

將下載的 LINE 貼圖包安裝到 Adam_chat。

## 觸發條件

使用者說「安裝貼圖」、「新增貼圖」、「加貼圖」、「裝貼圖」之類。

## 執行流程

### Step 1：掃描

```bash
node vocechat-web/scripts/add-sticker.mjs scan
```

會搜尋以下位置的 ZIP 檔與已解壓資料夾（含 `productInfo.meta`）：
- `C:\Users\User\Desktop\`
- `C:\Users\User\Downloads\`
- `C:\Users\User\Desktop\Adam_lab\Adam_chat\sticker\`

輸出 JSON 陣列，依修改時間由新到舊排序。每項包含：`path`, `type`（zip/folder）, `title`, `packageId`, `stickerCount`, `mtime`。

### Step 2：決定目標

- 0 個候選 → 告訴使用者找不到，請他確認下載位置
- 1 個候選 → 直接用它
- 多個候選 → 列出給使用者選，預設最新那個

### Step 3：決定 packId

packId 是 URL 用的短英文識別碼（例如 `cat`、`rabbit28`）。

- 優先讀 `vocechat-web/public/stickers/packs.json` 看現有 ID 避免衝突
- 根據 `title.en` 或 `title.zh_TW` 建議一個簡短 ID，向使用者確認
- 若使用者指定就用使用者的

### Step 4：安裝

```bash
node vocechat-web/scripts/add-sticker.mjs install "<source-path>" <pack-id>
```

腳本行為：
- ZIP → 解壓到暫存資料夾後處理，處理完自動清暫存
- 資料夾 → 直接讀取（不搬移、不刪除）
- 複製所有圖檔到 `vocechat-web/public/stickers/<pack-id>/`
- **若 ZIP 內含 `animation/` 子資料夾**：以 `animation/{id}.png`（APNG）覆蓋根目錄的靜態 `{id}.png`
- **重產 `_key.png`**：用 sharp 從 main 取第一幀（APNG 也適用）做高解析度靜態縮圖，覆蓋 LINE 原檔的 _key（避免動態包原檔 75×70 在 picker 上糊）
- 更新 `vocechat-web/public/stickers/packs.json`（若 ID 已存在則覆蓋該筆）

輸出 JSON：`{ status, packId, name, stickerCount, filesCopied, animatedCount, keysRegenerated, overwriting, destDir, hasAnimation, hasSound }`。`animatedCount > 0` 表示裝到動態版本。

### Step 5：回報

告訴使用者：
- 已安裝 `<name>`（共 N 張）
- 原始下載檔/資料夾保留在原地，未刪除
- 請到 dev server（`/start-dev` 啟動）測試貼圖分頁
- 確認外觀正常後再 push（遵守 UI 改動規則）

## 快取策略（不可踩的雷）

正式機 Caddyfile 對 `/stickers/*` 必須維持：
```
header Cache-Control "public, max-age=300, must-revalidate"
```

**禁止加 `immutable` directive**。曾經有過慘痛經驗：
- `immutable` 寫進使用者瀏覽器的快取項目後，瀏覽器**永遠不會回 server 驗證**
- 即使 server 端 _key.png 重產為高解析度，使用者看到的永遠是舊低解析度版
- 連 hard reload (Ctrl+Shift+R)、unregister SW 都繞不過
- 唯一解：**改 URL**（如 `?v=N`）或叫使用者完全清 site data

目前 `sticker-picker.tsx` 留有 `?v=2` cache-buster 是當年那次 immutable 災難的遺產，可以永遠留著（無害），用來繞開歷史快取。

**未來重產 _key.png 後**：
- 直接 push、等 Railway 部署完
- 5 分鐘內所有使用者瀏覽器透過 ETag 自動驗證並更新
- 不需要再 bump 版本號、不需要使用者清快取

## 注意事項

- **一包一 packId，絕不混合**：每個 LINE 貼圖包必須有獨立 packId，對應 `public/stickers/<packId>/` 獨立資料夾 + `packs.json` 獨立一筆。**不得把兩個包的貼圖裝進同一個 packId**
- **使用者資料夾保持乾淨**：來源是 ZIP 時一律解壓到 `%TEMP%` 處理後自動清除；不得在 `Adam_chat/sticker/` 或 `Desktop/` 等來源位置留下解壓後的資料夾
- **不刪除原始 ZIP**：使用者自行管理
- **覆蓋前告知**：若 packId 已存在，先告訴使用者會覆蓋舊資料
- **動態貼圖已支援（APNG）**：瀏覽器原生支援 APNG，`<img>` 會自動播放。但前提是 ZIP 內含 `animation/` 子資料夾（真正的 APNG 檔）
  - **使用者下載時要點對按鈕**：LINE Store 頁面有兩排
    - **靜態貼圖打包**（綠）→ ZIP 只有根目錄靜態 PNG，`hasAnimation: true` 但不會動
    - **動態/有聲貼圖打包**（藍）→ ZIP 多一個 `animation/` 子資料夾裝 APNG，才會動
  - 若 meta 顯示 `hasAnimation: true` 但裝完 `animatedCount === 0`，代表使用者下載了靜態版本，要提醒重抓
- **有聲貼圖**：`.m4a` 音檔不會自動播，需另寫 click 觸發的 `<audio>`。目前未實作
- **LINE ZIP 結構**：
  - 根目錄：`{id}.png`（靜態或第一格）、`{id}_key.png`（picker 縮圖，固定靜態）、`tab_on.png`、`tab_off.png`、`productInfo.meta`
  - 若為動態下載：多一個 `animation/{id}.png`（APNG，檔案大 35KB–200KB）
- **productInfo.meta 格式**：JSON，含 `packageId`, `title.{en,zh_TW}`, `author.{en,ja,zh_TW}`, `stickers[{id,width,height}]`, `hasAnimation`, `hasSound`, `stickerResourceType`
