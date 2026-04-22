# 啟動本機開發環境

當使用者說「開始專案」、「啟動測試機」、「部署前端」、「start dev」、「開發環境」或類似語意時，執行以下流程：

## 執行步驟

### Step 1：確認後端
```bash
docker inspect vocechat-server --format '{{.State.Running}}'
```
- 若回傳 `true` → 後端正常，繼續
- 若回傳 `false` 或錯誤 → 告知使用者開啟 Docker Desktop，等待確認後再繼續

### Step 2：啟動前端 dev server
```bash
cd "C:/Users/User/Desktop/Adam_lab/Adam_chat/vocechat-web" && pnpm start
```
- 等待出現 `Compiled successfully` 字樣
- 確認後回報：前端已啟動於 http://localhost:3001，後端於 http://localhost:3009

### Step 3：回報狀態
簡潔告知：
- 後端：✅ localhost:3009
- 前端：✅ localhost:3001
- 可以開始開發或測試

## 排錯知識點（2026-04-21）
- 前端**不是 Docker**，是 `pnpm start` dev server，重開機後消失是正常的
- `package.json` scripts 原本用 bash 語法（`$(date +%s)`），PowerShell 不支援 → 已改用 `cross-env`
- dev server 預設 port 是 3009，與後端衝突 → 已在 script 加 `PORT=3001` 固定
- 後端 Docker RestartPolicy = `always`，只要 Docker Desktop 開著就自動在
