# Adam_chat 專案

> **繼承**：全域 `~/.claude/CLAUDE.md` ＋ `Adam_lab/CLAUDE.md` ＋ `Adam_lab/CONVENTIONS.md`。通用規則（白話文、第一性原理、開發紀律、UI／體驗慣例）一律沿用上層，**本檔不重抄**。
> **棧別**：第三方框架自架（VoceChat：React 前端 + `vocechat-server` 後端 image）
> 本檔只放本專案特有的穩定規則；**不列資料夾現有內容**（看現況）、**不堆歷史進度**（進規格／DESIGN_SYSTEM）。

## 專案說明
基於 VoceChat 開源框架建立的自架通訊軟體。
- `vocechat-web/` — 前端（React + Tailwind，pnpm 管理）
- `vocechat-data/` — 後端資料（db、msg、upload 等）

## 本機開發環境
用 `/start-dev` 啟動（skill 內含完整步驟與排錯知識）。

## 資源地圖（情境 → 看哪裡）
- **要改畫面 / 顏色 / 樣式（UI 規範）** → `UI_style/DESIGN_SYSTEM.md`
- **要在本機把服務跑起來** → 用 `/start-dev`（skill 內含完整步驟與排錯知識）
- **想知道系統現況與過去做了什麼（歷史紀錄）** → `UI_style/DESIGN_SYSTEM.md` 末段「F. 變更歷史」

## 進行中事項
- UI / 功能優化（已上線、持續打磨）

> 已穩定的事實：本機環境已建好（前端 dev server 3001、後端 Docker 3009）；已上架為 PWA、安裝測試通過。更早的逐項完成紀錄已搬到 `UI_style/DESIGN_SYSTEM.md` 的「F. 變更歷史」。

## 部署與環境
一句話：Railway 雲端代管、前後端打包成一個容器（Docker image）、GitHub 連結後自動部署，費用約略落在每月個位數美元（會變，以平台帳單為準）。
- **平台 / 網址：** Railway，對外用免費子網域（`xxx.railway.app`），HTTPS 對外 443，內部 Port 由 Railway 自動分配。
- **容器建構（Docker 多階段建構）：** 用 Node 20 Alpine 建前端、`privoce/vocechat-server:latest` 跑後端，打包進同一個 image。
- **前端設定：** build 時設 `REACT_APP_RELEASE=true`，接口（API）自動走 `location.origin`，不必硬寫網址。
- **資料存放：** SQLite 資料庫，放在掛載的持久磁碟（Persistent Volume）`/data`（資料庫在 `/data/db/`）。

## 改 code 前掃影響範圍（本專案重點）

第一性原理三步驟、Serena 影響分析的通則 → **沿用上層**（全域 `rules/first-principles.md`）。本專案要額外記住的：
- **Serena 根目錄**：`C:\Users\User\Desktop\Adam_lab\Adam_chat`（索引已於 2026-05-29 建好、typescript/python，直接用、不用重建）。
- **符號層查不到的踩雷點**：共用的 state / context / localStorage key / Service Worker——Serena 的 `find_references` 抓不到這些，仍要照三步驟**自己再掃一次**。

## 跟 CONVENTIONS 不一樣的地方（本專案特例）

### 畫面改動要先問才推上去
本專案在「跨專案慣例（`Adam_lab/CONVENTIONS.md`）」之外，多一條自己的 push 規則：
- **功能相關改動**（邏輯、hook、API、資料處理等非畫面部分）：改完可直接 push
- **畫面相關改動**（UI、樣式、Layout、元件外觀，包含顏色、尺寸等小改動）：改完後先讓使用者確認，**不可直接 push**
- **混合改動**（同時包含功能與畫面）：牽涉畫面一律必須先問過使用者再 push

## UI 慣例

### Design System

**任何下列情況 —— 即使只動一行 —— 必讀** `UI_style/DESIGN_SYSTEM.md`：
- 修改既有 UI 顏色、樣式、Tailwind className、CSS 變數、視覺呈現
- **新增元件 / 新增頁面 / 新增畫面**（無論大小，含修改路由表）
- 動到 token 系統檔案（`index.css` 的 `.dark` / `.light`、`tailwind.config.js`）

文件結構：
- **A 區**：6 條無條件觸發規則 + 改色 SOP
  - Trigger 5「新增元件必須加進 C 元件表 + 用 token 色」
  - Trigger 6「優先複用既有元件」（要做新畫面前先掃 C 表找既有外殼複用，不重新發明）
- **B 區**：檔案位置、token 對照、變數格式、禁用清單
- **C 區「元件表」**：按 UI 表面分類列出所有元件 + token + 檔案
- **D 區「回歸驗證清單」**：色票相關修改後必跑的 9 點目視確認

**新元件落地的同一個 commit 就要把 C 表更新好；要做新畫面前必先掃 C 表找既有元件複用，找得到就不另建。否則視同未完成。**

### 語系一致性規則

**核心原則**：使用者目前是什麼語系，畫面上就只該看到那個語系的文字（除非該位置明確設計為雙語並列）。中文語系不該出現英文寫死字串、英文語系不該出現中文寫死字串。

**觸發條件（觀察型，不是主動全掃）**：
在實作 / 閱讀 / 改動 UI 檔的過程中，若**看到**寫死的非當前語系字串（典型形式：`toast.success("Copied!")`、`placeholder="Edit Message"`、`<span>Replying to ...`、簡中如「逐条转发」等），需：
1. **先停下來回報使用者**，列出位置 + 違規字串 + 建議修法（不要直接動手改）
2. **等使用者指示**才修正
3. 修正方式：抽成 `t("key", { ns: "..." })` + 在對應語系檔補 key（zh-TW + en，其他語系會 fallback 到 en）

**locale 檔位置與分類**：
- 路徑：`vocechat-web/public/locales/{lang}/{ns}.json`，主要語系是 `zh-TW` 與 `en`
- 分類原則：
  - `common.json` — 通用 action / placeholder / tip（複製、轉傳、收藏成功等）
  - `chat.json` — 聊天相關（訊息、頻道、回覆、編輯、貼圖、語音等）
  - `setting.json` / `auth.json` / `member.json` / `file.json` / `widget.json` / `welcome.json` / `fav.json` — 對應領域
- 加新 key 必須兩邊（zh-TW 與 en）同時補；其他語系自動 fallback 到 en。

**例外**（保留原樣，無需修正）：
- 商品名 / 版本號 / 程式碼 snippet（如 `localStorage.theme`）
- 明確設計為雙語並列的位置（要在註解標明）
- 第三方 API 回傳的英文錯誤訊息

### SVG 上色規則
- stroke-based SVG（如 `arrow.left.svg`）：父層用 `stroke-X` token，**禁止用 `fill-`**
- fill-based SVG：SVG 內用 `fill="currentColor"` + 父層 `text-X` token；若 SVG 寫死 hex 則父層加 `fill-current` 才能覆蓋
- 右箭頭一律用 `arrow.left.svg` + `rotate-180`，不另用 `arrow.right.svg`
- 詳見 DESIGN_SYSTEM.md C.14「Inline SVG assets」

### Header icon 尺寸規範
- 容器：`h-9 w-9 flex-center`
- 圖示：`w-5 h-5`
- 間距：`gap-2`

### Layout aside 規則
- aside 為桌面版專用，class 用 `hidden md:flex`
- 手機版 icon 放進 header 右側 `ul`，僅手機顯示的加 `md:hidden`
