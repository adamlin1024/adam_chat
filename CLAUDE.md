# Adam_chat 專案

## 專案說明
基於 VoceChat 開源框架建立的自架通訊軟體。
- `vocechat-web/` — 前端（React + Tailwind，pnpm 管理）
- `vocechat-data/` — 後端資料（db、msg、upload 等）

## 本機開發環境
用 `/start-dev` 啟動（skill 內含完整步驟與排錯知識）。

## 專案進度

**已完成：**
- 本機環境建置（前端 dev server 3001、後端 Docker 3009）
- 多語系繁體中文化
- 元件改寫完成
- 上架方案：PWA
- 雲端部署：Railway（前後端一體，GitHub 連結自動部署，Persistent Volume 掛載 `/data`）
- PWA 安裝測試通過

**進行中：**
- UI / 功能優化

## 部署架構
- **平台：** Railway，免費方案約 $1–2/月
- **Domain：** Railway 免費子網域（`xxx.railway.app`）
- **前端：** Docker 多階段建構打包進 image，`REACT_APP_RELEASE=true`
- **後端：** `privoce/vocechat-server:latest`

## 工作流程規則
- **功能相關改動**（邏輯、hook、API、資料處理等非畫面部分）：改完可直接 push
- **畫面相關改動**（UI、樣式、Layout、元件外觀，包含顏色、尺寸等小改動）：改完後先讓使用者確認，**不可直接 push**
- **混合改動**（同時包含功能與畫面）：功能部分可先 push，畫面部分必須先問過使用者再 push

## 技術細節
- Docker 多階段建構：Node 20 Alpine 建前端，privoce/vocechat-server 跑後端
- 前端 build 時設定 `REACT_APP_RELEASE=true`，API 自動使用 `location.origin`，不需硬寫網址
- 資料庫：SQLite，存放於 `/data/db/`
- Port：Railway 自動分配，對外 443（HTTPS）

## UI 慣例

### 色彩系統

**任何下列情況 —— 即使只動一行 —— 必讀** `UI_style/COLOR_SYSTEM.md`：
- 修改既有 UI 顏色、樣式、Tailwind className、CSS 變數、視覺呈現
- **新增元件 / 新增頁面 / 新增畫面**（無論大小，含修改路由表）
- 動到 token 系統檔案（`index.css` 的 `.dark` / `.light`、`tailwind.config.js`）

文件 A 區有 5 條無條件觸發規則（含 Trigger 5「新增元件必須加進 C 元件表 + 用 token 色」）、B 區規則參考、**C 區元件表**、D 區回歸清單。**新元件落地的同一個 commit 就要把 C 表更新好，否則視同未完成。**

### SVG 上色規則
- stroke-based SVG（如 `arrow.left.svg`）：父層用 `stroke-X` token，**禁止用 `fill-`**
- fill-based SVG：SVG 內用 `fill="currentColor"` + 父層 `text-X` token；若 SVG 寫死 hex 則父層加 `fill-current` 才能覆蓋
- 右箭頭一律用 `arrow.left.svg` + `rotate-180`，不另用 `arrow.right.svg`
- 詳見 COLOR_SYSTEM.md C.14「Inline SVG assets」

### Header icon 尺寸規範
- 容器：`h-9 w-9 flex-center`
- 圖示：`w-5 h-5`
- 間距：`gap-2`

### Layout aside 規則
- aside 為桌面版專用，class 用 `hidden md:flex`
- 手機版 icon 放進 header 右側 `ul`，僅手機顯示的加 `md:hidden`
