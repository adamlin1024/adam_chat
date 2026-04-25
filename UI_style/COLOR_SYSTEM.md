# Adam_chat 色彩系統

> **單一資料來源**：所有顏色皆來自 token 系統。日後改色 = 改 `vocechat-web/src/assets/index.css` 的 CSS 變數，**不該動元件**。

## 系統檔案位置

| 角色 | 路徑 |
|---|---|
| Token 名稱 → CSS var 對映（給 Tailwind 用） | `vocechat-web/tailwind.config.js` |
| **Token → hex 對照（深色 / 淺色）★ 改色入口** | `vocechat-web/src/assets/index.css`（`.dark` / `.light` 區塊） |
| 主題切換邏輯 | `vocechat-web/src/index.tsx`、`src/routes/setting/Overview/DarkMode.tsx`、`public/index.html`（splash 階段先掛 class） |
| 設計參考預覽 | `UI_style/preview (護眼淺色).html` 等 |
| 一次性遷移腳本 | `UI_style/migrate_colors*.py`（工具，不需保留執行） |

## Token 對照表

| Token | 用途 | 深色 | 淺色 |
|---|---|---|---|
| **Backgrounds** | | | |
| `bg-bg-app` | App 外框 / icon 欄 | `#08090b` | `#f2efe9` |
| `bg-bg-sidebar` | Session 欄 | `#0c0d10` | `#f7f5f1` |
| `bg-bg-canvas` | 主聊天區 | `#0a0b0e` | `#f5f2ec` |
| `bg-bg-surface` | active / 卡片底 | `#141519` | `#e6e2db` |
| `bg-bg-elevated` | 彈窗 / context menu / Toast | `#0c0d10` | `#f7f5f1` |
| `bg-bg-hover` | 列表 hover | `#0f1014` | `#ede9e3` |
| `bg-bg-overlay` | Modal 遮罩 | `rgba(0,0,0,0.7)` | `rgba(0,0,0,0.4)` |
| **Borders** | | | |
| `border-border-subtle` | 面板間隔線 | `#18191d` | `#dbd7d0` |
| `border-border` | 按鈕、input、卡片邊框 | `#27272a` | `#ccc8c1` |
| `border-border-strong` | focus / hover 邊框 | `#3f3f46` | `#9e9a93` |
| **Text (`fg-*`)** | | | |
| `text-fg-primary` | 主標題 | `#f4f4f5` | `#1c1a17` |
| `text-fg-body` | 內文 | `#d4d4d8` | `#3d3a35` |
| `text-fg-secondary` | 次要文字 | `#a1a1aa` | `#6b6865` |
| `text-fg-muted` | 弱化說明 | `#71717a` | `#888480` |
| `text-fg-subtle` | 更弱化（時間戳等） | `#52525b` | `#a09c96` |
| `text-fg-disabled` | 不可用狀態 | `#3f3f46` | `#9e9a93` |
| **Accent (品牌主色)** | | | |
| `accent` / `bg-accent` / `text-accent` | 主色（頭像、active、按鈕、連結） | `#5eead4` | `#0d9488` |
| `accent-hover` | hover | `#2dd4bf` | `#0f766e` |
| `accent-pressed` | pressed | `#14b8a6` | `#0e6b63` |
| `accent-on` | accent 上的文字 | `#042f2e` | `#ffffff` |
| `accent-bg` | 淡 accent 底（pin、active 提示） | `rgba(94,234,212,0.08)` | `rgba(13,148,136,0.08)` |
| `accent-border` | 淡 accent 邊框 | `rgba(94,234,212,0.19)` | `rgba(13,148,136,0.19)` |
| **Semantic** | | | |
| `online` | 在線、成功狀態 | `#4ade80` | `#4ade80` |
| `idle` | 閒置、警告 | `#fbbf24` | `#fbbf24` |
| `offline` | 離線（同 fg-subtle） | `#52525b` | `#a09c96` |
| `danger` | 危險文字 / icon | `#f87171` | `#f87171` |
| `danger-bg` | 危險按鈕底 | `#ef4444` | `#ef4444` |

> **不在系統內的色**：避免使用。如需新狀態色，請在這份文件新增 token 並同步 `index.css` + `tailwind.config.js`。

## 開發規則（強制）

❌ **禁止**：
- `text-white` / `text-black` / `bg-white` / `bg-black`（除了 `bg-danger-bg text-white` 紅底白字一例）
- `text-zinc-*` / `bg-zinc-*` / `border-zinc-*` 等 Tailwind 預設調色盤
- `text-[#xxx]` / `bg-[#xxx]` 等寫死 hex
- `dark:` 前綴（除非真要在深色額外加效果）—— token 已自動切換
- inline style 寫 hex（用 `var(--c-...)` 或 className）
- 舊 `primary-N` palette（已遷移到 `accent-*`）

✅ **只能用** 上表的 token。

### 改色流程（未來標準作業）

1. 拿到新色票 preview。
2. 依 token 名稱對照（不動 token 名，只改 hex）。
3. 編輯 `vocechat-web/src/assets/index.css` 的 `.dark` / `.light` 區塊。
4. 重整頁面驗證。**不需動任何元件檔。**

## 元件清單（已通過 token 化稽核）

> 全部歷經自動遷移腳本 + 手動修補。此後任何元件**僅可用上表 token**。

### 全域基礎
- `src/index.tsx` — Toaster、iOS 遮罩
- `src/index-widget.tsx` — Widget 主題 class 切換
- `public/index.html` — splash 階段預掛 class
- `src/assets/index.css` — `:root.dark` / `:root.light` CSS 變數定義 + 全域 scrollbar / context-menu / setting-container

### Layout 與導航（17）
`routes/chat/index.tsx`、`routes/chat/Layout/index.tsx`、`routes/chat/Layout/LoginTip.tsx`、`routes/chat/Layout/DnDTip.tsx`、`routes/chat/Layout/DMVoicing.tsx`、`routes/chat/Layout/Operations.tsx`、`routes/chat/Layout/LicenseOutdatedTip.tsx`、`routes/chat/Layout/NewMessageBottomTip.tsx`、`routes/chat/Layout/VirtualMessageFeed/index.tsx`、`routes/chat/Layout/VirtualMessageFeed/CustomHeader.tsx`、`routes/chat/SessionList/Session.tsx`、`routes/chat/SessionList/ContextMenu.tsx`、`routes/chat/SessionList/index.tsx`、`routes/chat/GuestSessionList/Session.tsx`、`routes/chat/RTCWidget.tsx`、`routes/chat/VoiceFullscreen.tsx`、`routes/home/index.tsx`、`routes/home/Menu.tsx`

### Message 與輸入（13）
`components/Message/index.tsx`、`components/Message/EditMessage.tsx`、`components/Message/Reply.tsx`、`components/Message/Reaction.tsx`、`components/Message/ReactionPicker.tsx`、`components/Message/PreviewMessage.tsx`、`components/Message/ForwardedMessage.tsx`、`components/Message/URLPreview.tsx`、`components/Message/ExpireTimer.tsx`、`components/Message/renderContent.tsx`、`components/MessageInput/index.tsx`、`components/MessageInput/plate-ui/*`、`components/PinnedMessage.tsx`

### Modal / Form（20+）
`components/ChannelModal/index.tsx`、`components/ForwardModal/index.tsx`、`components/InviteModal/*`、`components/AnnouncementModal.tsx`、`components/AnnouncementBanner.tsx`、`components/UsersModal.tsx`、`components/NicknameModal.tsx`、`components/ReLoginModal.tsx`、`routes/setting/UpdatePasswordModal.tsx`、`routes/setting/LogoutConfirmModal.tsx`、`routes/setting/ProfileBasicEditModal.tsx`、`routes/setting/License/LicensePriceListModal.tsx`、`routes/chat/SessionList/DeleteDMConfirmModal.tsx`、`components/LeaveChannel/TransferOwnerModal.tsx`、`routes/setting/BotConfig/*Modal.tsx`、`components/Send/*` 等

### 設定頁（30+）
`routes/setting/Overview/*`、`routes/setting/MyAccount.tsx`、`routes/setting/PasskeyManagement.tsx`、`routes/setting/NotificationSettings.tsx`、`routes/setting/AdminNotificationChannels/index.tsx`、`routes/setting/APIDocument.tsx`、`routes/setting/APIConfig.tsx`、`routes/setting/Widget/*`、`routes/setting/BotConfig/*`、`routes/setting/License/*`、`routes/setting/config/*`、`routes/settingChannel/*`

### 列表 / Filter（10+）
`routes/files/*`、`routes/files/Filter/*`、`routes/resources/*`、`routes/resources/Filter/*`、`routes/favs/index.tsx`、`routes/users/index.tsx`、`routes/chat/FavListModal.tsx`

### 認證流程（10+）
`routes/login/*`、`routes/reg/*`、`routes/oauth/*`、`routes/callback/*`、`routes/onboarding/*`、`routes/sendMagicLink/*`、`routes/invitePrivate/*`

### 共用元件（30+）
`components/styled/*`（Radio / Toggle / Button / Select / Label）、`components/User/*`、`components/Profile/*`、`components/Avatar*`、`components/FileMessage/*`、`components/FileBox/*`、`components/Voice/*`、`components/Channel.tsx`、`components/ChannelIcon.tsx`、`components/Server.tsx`、`components/Signal.tsx`、`components/QRCode.tsx`、`components/Tooltip.tsx`、`components/SettingBlock.tsx`、`components/StyledSettingContainer.tsx`、`components/Loading.tsx`、`components/ErrorCatcher.tsx`、`components/Version.tsx`、`components/Divider.tsx`、`components/GoBackNav.tsx`、`components/InactiveScreen.tsx`、`components/Manifest/Prompt.tsx`、`components/Language.tsx`、`components/SearchUser.tsx`、`components/ManageMembers/*`、`components/TextInput/index.tsx`、`components/ServerVersionChecker.tsx`、`components/ConfigTip.tsx`、`components/AutoDeleteMessages.tsx`、`components/AddEntriesMenu.tsx`、`components/ContextMenu.tsx`、`components/ActionSheet.tsx`、`components/GoogleLoginButton.tsx`

### Widget popup
`widget/Popup/*`（含 Login / Header / Footer / Welcome / MessageInput / MessageFeed / Message/* / InviteOnlyTip）

> **共約 200 個檔案**完成 token 化（自動腳本第 1 輪 897 處 + 第 2 輪 160 處 + 第 3 輪 32 處 + 第 4 輪 292 處消滅冗餘 `dark:` 前綴 + 手動修補約 12 處 = **約 1393 處**）。

## 已知例外

- `routes/chat/SessionList/Session.tsx` 左滑「刪除」按鈕 `bg-danger-bg text-white` —— 紅底白字兩主題皆可讀，刻意保留。
- `assets/index.css` `.context-menu .item.danger:hover { color: #fff }` —— 同上。
- `components/BlankPlaceholder.tsx` SVG 表情圖案 hex（`#FFDB5D` 等）—— 屬於插畫資產色，不入主題系統。
- `routes/setting/Widget/index.tsx` 內嵌的 HTML 範例 snippet —— 是給使用者複製的程式碼字串，非實際 UI。
- `routes/setting/config/Vocespace.tsx` 部分 `style={{ color: "#fff" }}` —— 第三方整合畫面，需另外處理。
- `service-worker.ts` 的 `theme_color: "#08090b"` —— PWA manifest，不隨主題切換（系統 chrome 限制）。

## 變更歷史

- **2026-04-25**：建立完整 token 系統 + 雙主題並存 + 全面元件 sweep（1089 處替換）+ 此份文件。
