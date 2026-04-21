# Adam_chat 專案

## 專案說明
基於 VoceChat 開源框架建立的自架通訊軟體。
- `vocechat-web/` — 前端（React + Tailwind，pnpm 管理）
- `vocechat-data/` — 後端資料（db、msg、upload 等）

## 已完成事項
1. **Docker 部署完成** — Local 3001（前端）與 3009（後端）皆已部署並確認開機正常
2. **語系修正完成** — 多語系檔案中所有簡體中文已全數轉為繁體中文
3. **元件更新完成** — 元件改寫完畢，元件檔已同步更新
4. **上架方案決定** — 採用 PWA（安裝測試完成）
5. **雲端平台決定** — 採用 Railway，免費方案約 $1–2/月，不使用視訊/通話
6. **雲端部署完成** — Railway 部署驗證成功，PWA 安裝測試通過

## 進行中事項
- UI / 功能優化中

## 部署架構（2026-04-20 決定）
- **平台：** Railway（前後端一體，單一網址）
- **Domain：** 暫時使用 Railway 免費子網域（`xxx.railway.app`），未來再考慮購買
- **資料：** Railway Persistent Volume 掛載於 `/data`
- **前端：** 每次部署時透過 Docker 多階段建構打包進 image
- **後端：** `privoce/vocechat-server:latest`

## 部署步驟（已完成）
1. [x] 確認 GitHub 帳號、申請 Railway 帳號
2. [x] 建立 `.gitignore`、`Dockerfile`、`entrypoint.sh`
3. [x] 初始化 git repo，推上 GitHub
4. [x] Railway 建立專案，連結 GitHub repo
5. [x] 設定 Railway Volume（掛載 `/data`）
6. [x] 驗證部署成功，測試基本功能
7. [x] PWA 安裝測試

## 工作流程規則
- **畫面相關改動**（UI、樣式、Layout、元件外觀）：改完後先讓使用者確認，**不可直接 push**
- **功能相關改動**（邏輯、hook、API、資料處理等非畫面部分）：改完可直接 push

## 技術細節
- Docker 多階段建構：Node 20 Alpine 建前端，privoce/vocechat-server 跑後端
- 前端 build 時設定 `REACT_APP_RELEASE=true`，API 自動使用 `location.origin`，不需硬寫網址
- 資料庫：SQLite，存放於 `/data/db/`
- Port：Railway 自動分配，對外 443（HTTPS）
