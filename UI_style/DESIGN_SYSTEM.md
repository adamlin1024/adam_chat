# Adam_chat Design System

> **單一資料來源**：所有顏色與元件樣式皆走 token 系統。
> 改色 = 改 `vocechat-web/src/assets/index.css` 的 CSS 變數，**不該動元件**。
> 新畫面 = **先從 C 元件表找最近的既有元件複用**，沿用既有外殼 / 動畫 / 慣性，避免重新發明、避免不一致。

文件分四區：

- **A. 動手前必看**（自動觸發規則 + 改色 SOP）
- **B. 規則參考**（檔案位置、token 對照、變數格式、禁用清單）
- **C. 元件表**（按 UI 表面分類，使用者口語 → 對應檔案 + token；**新元件必須優先複用既有的**）
- **D. 收尾**（回歸清單、例外、變更歷史）

---

## A. 動手前必看

### A.1 AI 自動執行規則（6 條 trigger，無條件，不需使用者提醒）

**Trigger 1 — 動到任何 `.tsx` / `.ts` / `.css` UI 檔**
改完前自掃該檔，違規 → 當下順手改成 token，不寫 TODO、不分批：
- Tailwind 預設色（`text-white` / `text-black` / `bg-white` / `bg-black`、`zinc/gray/slate/stone/neutral/red/orange/amber/yellow/lime/green/emerald/teal/cyan/sky/blue/indigo/primary` 等）
- 寫死 hex（`bg-[#xxx]` / `text-[#xxx]` / inline style 寫 hex）
- `dark:` 前綴覆寫（token 已自動切換，前綴只會讓淺色看到 base 錯色）
- 手寫 `var(--c-x)` 漏包 `rgb()`
- inline SVG 寫死 fill / stroke：如果該檔 `import X from "./x.svg"`，**確認 SVG 本身用 `fill="currentColor"` / `stroke="currentColor"`**，否則父層 `text-X` 傳不進去

**Trigger 2 — 動到色票或 Tailwind config**
即動到 `vocechat-web/src/assets/index.css` 的 `.dark` / `.light`，或 `vocechat-web/tailwind.config.js`：
- 改色票時 hex 必須先轉 RGB 三元組（`#5eead4` → `94 234 212`）
- **不可**把變數寫成 hex 字串（會讓 alpha 修飾子全失效，詳見 B.3）
- 必須在本檔末段 F「變更歷史」加一筆，記錄改了什麼、為什麼

**Trigger 3 — 看到任何元件用了非 token 的色**
無論你是不是來改色的，**當下順手 token 化**。例外見 E.

**Trigger 4 — 批次 UI 改動結束、要回報前**
對照 D.1「回歸驗證清單」確認沒有壞掉。可疑處先請使用者目視，不要直接收尾。

**Trigger 5 — 新增 UI 元件 / 新增頁面（無條件，無需提醒）**
建立任何新的 `.tsx` UI 元件、頁面、或畫面時：
1. **顏色一律走 token 系統**（沿用 B.2 表中 token，禁用清單 B.4 一條都不准踩；新狀態色要先在 B.2 新增並同步 `index.css` + `tailwind.config.js`）。
2. **必須在 C 元件表加一行**：找最接近的群組（C.1～C.13），補上「表面名稱 / 主要 token / 檔案路徑 / 常見坑」一列。**不要分批、不要 TODO**——元件落地的同一個 commit 就要把表更新好。
3. **唯一例外**：純臨時頁面（如 OAuth 第三方授權 redirect 頁、第三方整合頁，畫面只在外部回跳期間短暫出現），可不入元件表，但仍要用 token 顏色。例外要記在本檔 E. 已知例外段。

不更新 C 表 = 違反 Trigger 5，視同未完成。

**Trigger 6 — 「優先複用既有元件」原則（無條件，無需提醒）**
要新增任何元件 / 畫面 / 區塊前，**先掃 C 元件表**找有沒有可以直接複用的既有外殼。具體判斷流程：
1. 我要做的這個畫面，本質上是「Modal / 彈窗 / Sheet / Dropdown / Picker / Filter / 列表 / 卡片」這類已有大量既存元件的**通用形式**嗎？
2. 如果是 → 在 C 表對應群組（C.5 Modal / C.8 列表頁 / C.12 共用 styled / 等）找一個**結構最接近**的既有元件：
   - 完全相同 → 直接複用，只換內容（如 ForwardModal 直接沿用 UsersModal 外殼，僅換 list item 為 checkbox 多選 + 留言 + 送出按鈕）
   - 類似但需小調 → 提案使用「擴充既有元件」而非「另建新檔」，請使用者拍板
   - 真的找不到合適的 → 才新建，但仍要在 C 表加記錄（走 Trigger 5）
3. **絕對不要**因為「複用比較麻煩」就另建一個新元件——一致性優先於開發便利。

**為什麼**：自架元件（即使只是 Modal 殼）會在動畫慣性、關閉行為、鍵盤偏移處理、深淺色 token 上慢慢偏離既有規格，使用者體感「這支跟其他不一樣」就是不一致的來源。沿用既有外殼 = 動畫 / 拖把 / 鍵盤偏移 / 點外關閉等都自動繼承。

過往案例（值得學）：
- `ForwardModal` 沿用 `UsersModal` 外殼（手機 bottom-sheet + 拖把可拖收 + `useKeyboardOffset` + 桌機 centered modal + 點外關閉），只換內容為多選 checkbox + 留言 + 送出。

### A.2 改色 SOP

1. 拿到新色票 preview
2. 把每個 token 的新 hex **拆成空格分隔的 RGB 三元組**（`#5eead4` → `94 234 212`）
   - hex → RGB：Python `[int(h[i:i+2], 16) for i in (1, 3, 5)]` 或請我代勞
3. 編輯 `vocechat-web/src/assets/index.css` 的 `.dark` / `.light` 區塊，**只改數值，不動格式**
4. 跑 D.1 回歸驗證清單
5. 在 F. 變更歷史記一筆

不需動任何元件檔。

---

## B. 規則參考

### B.1 系統檔案位置

| 角色 | 路徑 |
|---|---|
| **改色入口（RGB 三元組）★** | `vocechat-web/src/assets/index.css`（`.dark` / `.light` 區塊） |
| Token 名稱 → CSS var 對映 | `vocechat-web/tailwind.config.js` |
| 主題切換邏輯 | `vocechat-web/src/index.tsx`、`src/routes/setting/Overview/DarkMode.tsx`、`public/index.html`（splash 階段先掛 class） |
| 設計參考預覽 | `UI_style/preview (護眼淺色).html` 等 |
| 一次性遷移腳本（封存） | `UI_style/_migration_history/` |

### B.2 Token 對照表

| Token | 用途 | 深色 | 淺色 |
|---|---|---|---|
| **Backgrounds** | | | |
| `bg-bg-app` | App 外框 / icon 欄 | `#08090b` | `#f2efe9` |
| `bg-bg-sidebar` | Session 欄 | `#0c0d10` | `#f7f5f1` |
| `bg-bg-canvas` | 主聊天區 | `#0a0b0e` | `#f5f2ec` |
| `bg-bg-surface` | active / 卡片底 | `#141519` | `#e6e2db` |
| `bg-bg-elevated` | 彈窗 / context menu / Toast | `#0c0d10` | `#f7f5f1` |
| `bg-bg-hover` | 列表 hover | `#0f1014` | `#ede9e3` |
| `bg-bg-overlay` | Modal 遮罩（pre-baked alpha） | `rgba(0,0,0,0.7)` | `rgba(0,0,0,0.4)` |
| **Borders** | | | |
| `border-border-subtle` | 面板間隔線 | `#18191d` | `#dbd7d0` |
| `border-border` | 按鈕 / input / 卡片邊框 | `#27272a` | `#ccc8c1` |
| `border-border-strong` | focus / hover 邊框 | `#3f3f46` | `#9e9a93` |
| **Text (`fg-*`)** | | | |
| `text-fg-primary` | 主標題 | `#f4f4f5` | `#1c1a17` |
| `text-fg-body` | 內文 | `#d4d4d8` | `#3d3a35` |
| `text-fg-secondary` | 次要文字 | `#a1a1aa` | `#6b6865` |
| `text-fg-muted` | 弱化說明 | `#71717a` | `#888480` |
| `text-fg-subtle` | 更弱化（時間戳等） | `#52525b` | `#a09c96` |
| `text-fg-disabled` | 不可用狀態 | `#3f3f46` | `#9e9a93` |
| **Accent（品牌主色）** | | | |
| `accent` | 主色（頭像、active、按鈕、連結） | `#5eead4` | `#0d9488` |
| `accent-hover` | hover | `#2dd4bf` | `#0f766e` |
| `accent-pressed` | pressed | `#14b8a6` | `#0e6b63` |
| `accent-on` | accent 上的文字 | `#042f2e` | `#ffffff` |
| `accent-bg` | 淡 accent 底（pre-baked） | `rgba(94,234,212,0.08)` | `rgba(13,148,136,0.08)` |
| `accent-border` | 淡 accent 邊框（pre-baked） | `rgba(94,234,212,0.19)` | `rgba(13,148,136,0.19)` |
| **Semantic** | | | |
| `online` | 在線、成功 | `#4ade80` | `#4ade80` |
| `idle` | 閒置、警告 | `#fbbf24` | `#fbbf24` |
| `offline` | 離線（同 fg-subtle） | `#52525b` | `#a09c96` |
| `danger` | 危險文字 / icon | `#f87171` | `#f87171` |
| `danger-bg` | 危險按鈕底 | `#ef4444` | `#ef4444` |

> 不在系統內的色：避免使用。如需新狀態色，在本檔新增 token 並同步 `index.css` + `tailwind.config.js`。

### B.3 變數格式（不可改）

#### 為什麼用 RGB 三元組

CSS 變數**必須**用空格分隔的 RGB 三元組：

```css
/* ✅ 正確 */
.dark { --c-accent: 94 234 212; }   /* #5eead4 拆成 R G B */

/* ❌ 錯誤 */
.dark { --c-accent: #5eead4; }
```

Tailwind 的 alpha 修飾子（`bg-accent/20`、`bg-online/15` 等）需要把 alpha 值塞進顏色函式。`tailwind.config.js` 將 token 包成 `rgb(var(--c-accent) / <alpha-value>)`，編譯期把 `<alpha-value>` 替換為 `0.2` 等數值。如果變數是 hex 字串，整個函式變 `rgb(#5eead4 / 0.2)` 是無效 CSS，瀏覽器直接放棄整條規則 → 半透明背景全部消失（先前氣泡事件）。

#### 預先疊好 alpha 的三個例外

`--c-bg-overlay` / `--c-accent-bg` / `--c-accent-border` 維持完整 `rgba(...)` 字串：

```css
--c-bg-overlay:    rgba(0, 0, 0, 0.7);
--c-accent-bg:     rgba(94, 234, 212, 0.08);
--c-accent-border: rgba(94, 234, 212, 0.19);
```

它們的角色就是「固定半透明色」，不需要 alpha 修飾子。Tailwind config 對它們直接用 `var(...)`，不加 `rgb()`。

#### 手寫 `var(--c-x)` 必須包 `rgb()`

CSS 檔、inline style、`box-shadow`、JS 動態 style：

```js
// ✅
cover.style.cssText = "background:rgb(var(--c-bg-app));"
{ color: "rgb(var(--c-fg-primary))" }
"inset-hairline": "inset 0 0 0 1px rgb(var(--c-border-default))"

// ❌ 渲染不出來
"background:var(--c-bg-app);"
{ color: "var(--c-fg-primary)" }
```

例外同上：`var(--c-bg-overlay)` / `var(--c-accent-bg)` / `var(--c-accent-border)` 直接用，不要包。

### B.4 禁用清單（never write）

❌ 在元件 / className / inline style / SVG 中**禁止**：
- `text-white` / `text-black` / `bg-white` / `bg-black`（唯一例外見 E.）
- Tailwind 預設調色盤：`zinc / gray / slate / stone / neutral / red / orange / amber / yellow / lime / green / emerald / teal / cyan / sky / blue / indigo / violet / purple / pink / rose / primary` 任何 N 階
- `bg-[#xxx]` / `text-[#xxx]` / `border-[#xxx]` 等寫死 hex
- `dark:` 前綴覆寫（token 已自動切換）
- inline style 寫 hex（用 `rgb(var(--c-...))` 或 className）
- 舊 `primary-N` palette（已遷移到 `accent-*`）
- inline SVG 內寫死 `fill="#xxx"` / `stroke="#xxx"`（用 `currentColor`）

✅ 只能用 B.2 表中的 token。

---

## C. 元件表

> 按 UI 表面分類，每組附「使用者怎麼描述」、「主要 token」、「核心檔案」、「常見坑」。
> 改某個 surface 的色或樣式 → 直接從這找對應檔案。新增元件時 → 找最接近的群組，沿用既有 token。

### C.1 App 結構與導航（外殼）

| 表面 | 主要 token | 核心檔案 |
|---|---|---|
| Icon bar（最左 56px） | `bg-bg-app` | `routes/home/index.tsx`、`routes/home/Menu.tsx`、`routes/home/User.tsx` |
| Session bar（左二 232px） | `bg-bg-sidebar`、`border-border-subtle` | `routes/chat/SessionList/index.tsx` |
| Chat header | `bg-bg-canvas`、`border-border-subtle` | `routes/chat/Layout/VirtualMessageFeed/CustomHeader.tsx` |
| Main canvas | `bg-bg-canvas` | `routes/chat/Layout/index.tsx` |
| 桌面 aside（功能側欄） | `bg-bg-sidebar`、`border-border-subtle` | `routes/chat/Layout/Operations.tsx`、`routes/chat/RTCWidget.tsx` |
| Splash 啟動畫面 | `--c-splash-bg`、`--c-splash-dot`（獨立變數） | `public/index.html` |

### C.2 SessionList 對話列表

| 表面 | 主要 token | 核心檔案 |
|---|---|---|
| Session row 預設 | `bg-bg-sidebar`、`text-fg-body`、`text-fg-disabled` | `routes/chat/SessionList/Session.tsx` |
| Session row hover | `bg-bg-hover` | 同上 |
| Session row active | `bg-bg-surface`、`shadow-inset-hairline` | 同上 |
| Session row 左滑（隱藏 / 刪除）| `bg-bg-surface text-fg-primary` / `bg-danger-bg text-white`（紅底白字 = E. 例外） | 同上 |
| Session 右鍵選單 | 走全域 `.context-menu`（CSS 定義） | `routes/chat/SessionList/ContextMenu.tsx` |
| Guest 版列表 | 同 Session row | `routes/chat/GuestSessionList/Session.tsx` |
| 刪除 DM 確認 | Modal 規格 | `routes/chat/SessionList/DeleteDMConfirmModal.tsx` |
| 「捲到最新」浮鈕 | 無未讀：`accent-bg` + `accent-border` + `text-accent`；有未讀：`bg-accent` + `text-accent-on` | `routes/chat/Layout/NewMessageBottomTip.tsx` |

**坑**：active 與 hover 不同（`bg-bg-surface` vs `bg-bg-hover`），別混。「捲到最新」浮鈕的箭頭 SVG（`double-down.svg`）必須 `fill="currentColor"`。

### C.3 Message 訊息流

| 表面 | 主要 token | 核心檔案 |
|---|---|---|
| 對方訊息氣泡 | `bg-bg-surface`、`border-border-subtle`、`text-fg-body` | `components/Message/index.tsx` |
| 自己訊息氣泡 | `bg-accent/20`、`text-fg-primary` | 同上 |
| Message hover | `bg-bg-hover` | 同上 |
| Pin 訊息高亮 | `bg-accent-bg`、`border-l-2 border-accent` | 同上 |
| 過期訊息底 | `bg-danger/10` | 同上 |
| 名稱 / admin icon | `text-fg-primary`、`fill-accent` | 同上 |
| 失敗狀態 | `text-danger`、`stroke-danger` | 同上 |
| 編輯訊息框 | `bg-bg-elevated`、`border-border` | `components/Message/EditMessage.tsx` |
| 引用 (Reply) | `bg-bg-surface`、`text-fg-secondary` | `components/Message/Reply.tsx` |
| 反應 (Reaction) | `bg-bg-surface`、`text-fg-body` | `components/Message/Reaction.tsx` |
| 反應選擇器 | `bg-bg-elevated` | `components/Message/ReactionPicker.tsx` |
| 預覽 / 轉傳訊息 | `bg-bg-surface`、`text-fg-secondary` | `components/Message/PreviewMessage.tsx`、`ForwardedMessage.tsx` |
| URL preview | `bg-bg-surface`、`border-border-subtle` | `components/Message/URLPreview.tsx` |
| 過期計時 | `text-fg-muted` | `components/Message/ExpireTimer.tsx` |
| Pin 訊息頂部條 | `bg-bg-elevated`、`border-border-subtle` | `components/PinnedMessage.tsx` |
| 訊息內容渲染 | inherits | `components/Message/renderContent.tsx` |
| 自訂日期分隔 | `text-fg-subtle` | `routes/chat/Layout/VirtualMessageFeed/CustomHeader.tsx` |
| 主訊息列表容器 | inherits | `routes/chat/Layout/VirtualMessageFeed/index.tsx` |
| 訊息長按 action panel（手機，LINE 風格） | `bg-bg-elevated`、`border-border`、`text-fg-body`、`text-fg-secondary`、`shadow-overlay`；hover/active：`bg-bg-hover`；danger 用 `text-danger` | `components/Message/MessageActionSheet.tsx`（含 action grid 與 reaction view 兩個 view）；觸發在 `components/Message/index.tsx` 用 `useLongPress` |
| 訊息桌機 hover bar（hidden md:flex） | `bg-bg-app`、`border-border`、`text-fg-subtle`、`fill-fg-subtle`、`shadow-dropdown` | `components/Message/Commands.tsx` |
| 訊息桌機右鍵選單 | 走全域 `.context-menu` | `components/Message/ContextMenu.tsx`（純殼，items 由父層傳入） |
| 訊息收藏標記 | `fill-accent` 書籤 icon，絕對定位在氣泡右上角（`-top-1.5 right-1.5`、`w-4 h-5`、`z-10`） | `components/Message/index.tsx`（讀 `useFavMessage().isFavorited(mid)`） |
| 多選操作底部 bar（手機 LINE 風格） | `bg-bg-elevated`、`border-border-subtle`、`text-fg-secondary`、`fill-fg-body`、`bg-bg-hover`（active）、`text-danger` / `fill-danger`（刪除） | `routes/chat/Layout/Operations.tsx`（多選模式下顯示） |
| 訊息編輯（手機，輸入區接管） | textarea 容器：`bg-bg-canvas`、`border-border`、`text-fg-primary`；外殼 `bg-bg-sidebar`；按鈕都 `w-9 h-9` 圓形、靠右並列 gap-3：✗ 取消 = `bg-bg-surface text-fg-subtle hover:bg-bg-hover`、✓ 儲存 = `bg-accent text-accent-on hover:bg-accent-hover active:bg-accent-pressed`；icon 用 `close.svg`（純 X）非 `close.circle.svg` | `components/Send/Editing.tsx`；redux 狀態見 `app/slices/message.ts` `editing` |

**坑**：
- `bg-accent/20` 是 alpha 修飾子 → 必須變數為 RGB triplet 才會渲染（先前事件源頭）
- Action panel 文字大小用 `ts-mini`（連動 `--msg-scale`，使用者設定大/中/小會跟著縮放）—— 不要寫 `text-[11px]` 等固定 px

### C.4 訊息輸入區

| 表面 | 主要 token | 核心檔案 |
|---|---|---|
| 文字輸入容器 | `bg-bg-surface`、`border-border` | `components/MessageInput/index.tsx`、`components/TextInput/index.tsx` |
| Emoji / Sticker 切換 button | `bg-bg-surface`、`text-accent`、`text-fg-subtle` | `components/MessageInput/plate-ui/emoji-input-picker/index.tsx` |
| Emoji / Sticker 面板 | `bg-bg-elevated` | `components/MessageInput/plate-ui/emoji-input-picker/emoji-tabbed-picker.tsx`、`sticker-picker.tsx` |
| Sticker 預覽遮罩 | `bg-bg-overlay`、`text-fg-primary/90`、`hover:bg-bg-hover` | `components/MessageInput/plate-ui/emoji-input-picker/index.tsx` |
| Mention combobox | `bg-bg-hover/50`、`text-fg-muted` | `components/MessageInput/plate-ui/combobox.tsx` |
| 上傳檔案列表 | `bg-bg-elevated`、`border-border` | `components/Send/UploadFileList/index.tsx`、`EditFileDetails.tsx` |
| Replying 提示 | `bg-bg-surface`、`text-fg-secondary` | `components/Send/Replying.tsx` |
| Markdown 編輯器 | `bg-bg-elevated`、`border-border` | `components/MarkdownEditor/index.tsx`、`assets/index.css` `.md-editor` |

### C.5 Modal / Sheet / Popup

| 表面 | 主要 token | 核心檔案 |
|---|---|---|
| Modal 背景遮罩 | `bg-bg-overlay` | `components/Modal/*` |
| Modal 容器 | `bg-bg-elevated`、`border-border-subtle`、`shadow-overlay` | `components/styled/Modal/*` |
| Action Sheet（手機底部） | `bg-bg-elevated`、`border-border-subtle` | `components/ActionSheet.tsx` |
| Channel Modal | 同上 | `components/ChannelModal/index.tsx` |
| Forward Sheet（LINE 風格快速分享 bottom-sheet：4×2 頭像 grid、第 8 格固定為「更多」） | `bg-bg-elevated`、`border-border`、`border-border-subtle`、`bg-bg-overlay`、`bg-bg-surface`（avatar 底）、`fill-fg-secondary`、`text-fg-secondary`、`bg-fg-disabled`（drag handle）、`bg-accent text-accent-on`（選中 ✓ + 底部 share button） | `components/ForwardSheet/index.tsx`；多選 ✓；點「更多」/🔍 → ForwardFullSheet |
| Forward Full Sheet（完整分享面板，固定 90vh 高、tab/搜尋/留言/多選） | 同 ForwardSheet token 集 + `bg-accent`（tab indicator + send button + ✓） | `components/ForwardFullSheet/index.tsx`；含留言 input、聊天/好友 tab、最近對象 + 完整列表 |
| Forward Modal（既有舊版，已被 ForwardSheet + FullSheet 取代，保留以防相容） | 同上 | `components/ForwardModal/index.tsx` |
| Invite Modal | 同上 | `components/InviteModal/*` |
| Announcement Modal / Banner | `bg-bg-elevated` / `bg-idle/10`+`text-idle`（warning banner） | `components/AnnouncementModal.tsx`、`AnnouncementBanner.tsx` |
| Users Modal | 同 Modal | `components/UsersModal.tsx` |
| Nickname Modal | 同上 | `components/NicknameModal.tsx` |
| ReLogin Modal | 同上 | `components/ReLoginModal.tsx` |
| Update Password / Profile Edit | 同上 | `routes/setting/UpdatePasswordModal.tsx`、`ProfileBasicEditModal.tsx` |
| Logout 確認 | 同上 | `routes/setting/LogoutConfirmModal.tsx` |
| License 價格 Modal | 同上 + `shadow-bg-app/40` | `routes/setting/License/LicensePriceListModal.tsx` |
| Delete DM 確認 | 同上 | `routes/chat/SessionList/DeleteDMConfirmModal.tsx` |
| Bot 相關 Modal | 同上 | `routes/setting/BotConfig/*Modal.tsx` |
| Transfer Owner | 同上 | `components/LeaveChannel/TransferOwnerModal.tsx` |
| Tooltip | `bg-bg-elevated`、`text-fg-primary` | `components/Tooltip.tsx` |
| Toast (react-hot-toast) | `bg-bg-elevated`、`text-fg-body`、`border-border` | `src/index.tsx`（Toaster style） |
| Context menu（全域） | `bg-bg-elevated`、`border-border`、`text-fg-secondary` | `assets/index.css` `.context-menu` |

**坑**：Modal 一律用 `bg-bg-elevated` 不是 `bg-bg-surface`。確認 Modal 容器有 `border-border-subtle`，避免淺色模式邊緣模糊。

### C.6 Setting 設定頁

| 表面 | 主要 token | 核心檔案 |
|---|---|---|
| Setting 容器 + block | `bg-bg-canvas`、`text-fg-primary`、`text-fg-secondary` | `components/SettingBlock.tsx`、`StyledSettingContainer.tsx`、`assets/index.css` `.setting-container` |
| Overview（含 Theme 切換） | inherits | `routes/setting/Overview/index.tsx`、`Overview/DarkMode.tsx`、`Overview/server.tsx` |
| My Account | inherits | `routes/setting/MyAccount.tsx` |
| Passkey / 通知 / API / Widget / License / Bot / Notification Channels | 沿用 `SettingBlock` | `routes/setting/*` |
| Channel 設定（公告、概覽） | inherits | `routes/settingChannel/*` |
| Vocespace（第三方） | 部分 inline style 為例外 | `routes/setting/config/Vocespace.tsx` |
| 各種 config Tooltip / HowTo | inherits | `routes/setting/config/Tooltip.tsx`、`HowToTip.tsx` |

### C.7 Auth / Onboarding（全螢幕）

| 表面 | 主要 token | 核心檔案 |
|---|---|---|
| Login / Register | `bg-bg-canvas`、`bg-bg-elevated`、`text-fg-primary`、`bg-accent text-accent-on` | `routes/login/*`、`routes/reg/*` |
| OAuth callback | inherits | `routes/oauth/*`、`routes/callback/*` |
| Onboarding wizard | inherits | `routes/onboarding/*` |
| Magic link 寄送 | inherits | `routes/sendMagicLink/*` |
| Invite 私人邀請 | inherits | `routes/invitePrivate/*`、`routes/reg/InviteInMobile.tsx` |
| 過期 / Email 步驟提示 | `text-fg-disabled`、`text-fg-primary` | `routes/reg/ExpiredTip.tsx`、`EmailNextStepTip.tsx` |

### C.8 列表頁（Files / Resources / Favs / Users）

| 表面 | 主要 token | 核心檔案 |
|---|---|---|
| 列表容器 | `bg-bg-canvas` | `routes/files/*`、`routes/resources/*`、`routes/favs/index.tsx`、`routes/users/index.tsx` |
| Filter pill（active/inactive） | active：`bg-bg-surface text-fg-primary shadow-inset-hairline`；inactive：`text-fg-subtle border-border-subtle hover:bg-bg-hover` | `routes/files/Filter/*`、`routes/resources/Filter/*` |
| View toggle（list / grid） | active：`bg-bg-surface fill-accent`；inactive：`fill-fg-secondary hover:bg-bg-hover` | `routes/files/View.tsx`、`routes/resources/View.tsx` |
| Filter dropdown | `bg-bg-elevated`、`border-border-subtle`、`hover:bg-bg-surface` | 同上 |
| Fav 列表 | inherits | `routes/chat/FavListModal.tsx` |

### C.9 Voice / RTC

| 表面 | 主要 token | 核心檔案 |
|---|---|---|
| Voice management 面板 | `bg-bg-elevated`、`text-fg-secondary`、`fill-fg-muted` | `routes/chat/VoiceChat/VoiceManagement.tsx`、`Dashboard.tsx` |
| Voice fullscreen | `bg-bg-canvas`、`bg-online/60`（speaking dot） | `routes/chat/VoiceFullscreen.tsx` |
| DM Calling 拖曳卡 | `bg-bg-elevated`、`shadow-bg-app/40`、`bg-online`（接聽）/`bg-danger-bg`（掛斷） | `components/Voice/DMCalling.tsx` |
| Voice operations bar | `bg-bg-elevated`、`bg-online`（分享中） | `components/Voice/Operations.tsx` |
| RTC widget（小窗） | `bg-online text-fg-body` 等 | `routes/chat/RTCWidget.tsx` |
| DM voicing（聊天列上方提示） | `bg-online hover:bg-online` | `routes/chat/Layout/DMVoicing.tsx` |

### C.10 File / Media

| 表面 | 主要 token | 核心檔案 |
|---|---|---|
| File message bubble | `bg-bg-surface`、`text-fg-body` | `components/FileMessage/*`（Audio/Video/Image/OtherFile/Expired/Download/Progress） |
| File preview box | `bg-bg-elevated` | `components/FileBox/preview/*`（Image/Audio/Code/Doc） |
| Avatar uploader | `bg-bg-app/50`、`text-fg-primary`（hover 遮罩） | `components/AvatarUploader.tsx` |
| Image / Avatar | inherits | `components/Avatar*` |

### C.11 Profile / User / Channel 資訊

| 表面 | 主要 token | 核心檔案 |
|---|---|---|
| User row | `text-fg-body`、`text-fg-disabled` | `components/User/index.tsx` |
| Profile 卡片 | `bg-bg-elevated`、`text-fg-primary` | `components/Profile/*` |
| Profile remark | `text-fg-primary` | `components/Profile/remark.tsx` |
| Channel item | `text-fg-body`、`fill-fg-subtle` | `components/Channel.tsx` |
| Channel icon | `fill-fg-subtle` | `components/ChannelIcon.tsx` |
| Server 切換 | `bg-bg-elevated` | `components/Server.tsx` |
| 訊號強度（Signal） | `bg-danger-bg` / `bg-idle` / `bg-online` | `components/Signal.tsx` |
| Manage members / 密碼相關 | inherits | `components/ManageMembers/*` |

### C.12 共用 styled / 工具元件

| 元件 | 主要 token | 檔案 |
|---|---|---|
| Button | `bg-accent text-accent-on`（primary）、`bg-bg-surface text-fg-primary`（ghost）、`bg-danger-bg text-white`（danger） | `components/styled/Button.tsx` |
| Input / TextInput | `bg-bg-surface`、`border-border`、`text-fg-body`、`placeholder:text-fg-disabled` | `components/styled/Input.tsx`、`components/TextInput/index.tsx` |
| Radio | `bg-bg-surface`、`text-fg-primary`、`border-border-strong`（未選）、`border-accent`+`bg-accent`（選中） | `components/styled/Radio.tsx` |
| Toggle | `bg-bg-surface` / `bg-accent`、`text-fg-primary` | `components/styled/Toggle.tsx` |
| Select | inherits | `components/styled/Select.tsx` |
| Label | `text-fg-secondary` | `components/styled/Label.tsx` |
| Checkbox | CSS `box-shadow: inset 10px 10px rgb(var(--c-accent))` | `assets/index.css` `.checkbox` |
| Loading | `bg-online/4ade80`（s-dot） | `components/Loading.tsx` |
| Error catcher | `text-danger` | `components/ErrorCatcher.tsx` |
| Inactive screen | `text-fg-primary` | `components/InactiveScreen.tsx` |
| Version | `text-fg-primary` | `components/Version.tsx` |
| Divider | `border-border-subtle` | `components/Divider.tsx` |
| GoBackNav | `text-fg-secondary` | `components/GoBackNav.tsx` |
| Search User | `bg-bg-surface`、`border-border` | `components/SearchUser.tsx` |
| QR code | inherits | `components/QRCode.tsx` |
| Manifest prompt | inherits | `components/Manifest/Prompt.tsx` |
| Language 選擇 | inherits | `components/Language.tsx` |
| Server version checker | `text-fg-secondary` | `components/ServerVersionChecker.tsx` |
| Config tip | `bg-bg-elevated` | `components/ConfigTip.tsx` |
| Auto delete messages | inherits | `components/AutoDeleteMessages.tsx` |
| Add entries menu | `bg-bg-elevated`、`text-fg-body` | `components/AddEntriesMenu.tsx` |
| Google login button | inherits | `components/GoogleLoginButton.tsx` |
| 全域 ContextMenu | `.context-menu` CSS | `components/ContextMenu.tsx`、`assets/index.css` |

### C.13 Widget Popup（嵌入第三方網站時的小視窗）

| 表面 | 主要 token | 核心檔案 |
|---|---|---|
| Popup 容器 | `bg-bg-elevated`、`border-border-subtle` | `widget/Popup/index.tsx` |
| Popup Header / Footer | `bg-bg-elevated`、`text-fg-primary` | `widget/Popup/Header.tsx`、`Footer.tsx` |
| Popup Welcome | `bg-bg-elevated`、`text-fg-primary` | `widget/Popup/Welcome.tsx` |
| Popup Login | `bg-bg-surface`、`border-border-strong` | `widget/Popup/Login/index.tsx` |
| Popup MessageInput | `bg-bg-surface`、`text-fg-primary`、`border-border-strong` | `widget/Popup/MessageInput.tsx` |
| Popup MessageFeed | `bg-bg-elevated`、`text-danger` | `widget/Popup/MessageFeed.tsx` |
| Popup Message bubble | `bg-accent text-accent-on` | `widget/Popup/Message/Text.tsx`、`Image.tsx`、`index.tsx` |
| Popup Invite-only tip | inherits | `widget/Popup/InviteOnlyTip.tsx` |
| Widget icon（觸發按鈕） | `bg-bg-elevated`、`shadow-xl`、`border-border-subtle` | `widget/Icon.tsx` |

### C.14 Inline SVG assets（使用注意）

import 為 React 元件的 SVG（`import X from "./x.svg"`）：
- **若 SVG 用 `fill="currentColor"`**：父層用 Tailwind `text-X` 即可控色（推薦）
- **若 SVG 寫死 `fill="#xxx"`**：父層 className 加 `fill-current` 才能覆蓋（次選）
- **若 SVG 是 stroke-based**：父層用 `stroke-` token，**禁止用 `fill-`**

已知需用 `currentColor` 才正確顯色的位置：
- `routes/chat/Layout/double-down.svg`（捲到最新箭頭）✓ 已修

例外（資產色，刻意保留）：
- `components/BlankPlaceholder.tsx` 內嵌 emoji 插畫色（`#FFDB5D` 等）
- `assets/icons/*.svg` 多數寫死 fill 作為預設色，被父層 `fill-current` 覆蓋

新增元件時若 import 新 SVG，先看一眼 SVG 內容是否 `currentColor`，否則加 `fill-current` className。

---

## D. 收尾

### D.1 回歸驗證清單（批次改完必跑）

改完色票或 alpha 相關元件，目視確認以下都正常（曾因變數格式錯誤全失效）：

- [ ] **訊息氣泡（自己側）**：`bg-accent/20` — 對話畫面看自己送的訊息有半透明 accent 底
- [ ] **Pin 訊息高亮**：`bg-accent-bg` + `border-accent`
- [ ] **過期訊息底**：`bg-danger/10`
- [ ] **狀態小徽章**：`bg-online/15`、`bg-online/20`
- [ ] **語音通話拖曳卡片陰影**：`shadow-bg-app/40`
- [ ] **Avatar hover 遮罩**：`bg-bg-app/50`
- [ ] **Sticker 預覽取消鍵**：`text-fg-primary/90`、`hover:bg-bg-hover`
- [ ] **shadow-inset-hairline**：active session row 內框
- [ ] **「捲到最新」浮鈕**：箭頭看得見（無未讀 = 淡 accent 底 + accent 箭頭；有未讀 = accent 底 + accent-on 文字）

---

## E. 已知例外

| 位置 | 例外 | 原因 |
|---|---|---|
| `routes/chat/SessionList/Session.tsx` 左滑刪除按鈕 | `bg-danger-bg text-white` | 紅底白字兩主題皆可讀，刻意保留 |
| `assets/index.css` `.context-menu .item.danger:hover` | `color: #fff` | 同上（紅底白字） |
| `components/BlankPlaceholder.tsx` SVG 插畫色 | `#FFDB5D` 等 | 屬於插畫資產色，不入主題系統 |
| `routes/setting/Widget/index.tsx` 內嵌 HTML snippet | `#1fe1f9` 等 | 給使用者複製的程式碼字串，非實際 UI |
| `routes/setting/config/Vocespace.tsx` 部分 inline style | `#fff` 等 | 第三方整合畫面 |
| `service-worker.ts` `theme_color` | `#08090b` | PWA manifest，系統 chrome 限制不隨主題切換 |
| `assets/icons/*.svg` 多數寫死 `fill="#xxx"` | hex 預設色 | 父層 `fill-current` 覆蓋；不影響主題切換 |

---

## F. 變更歷史

- **2026-04-25**：建立完整 token 系統 + 雙主題並存 + 全面元件 sweep（約 1393 處替換）+ 此份文件。
- **2026-04-25（同日修正）**：CSS 變數從 hex 字串改為 RGB 三元組格式，搭配 `rgb(var() / <alpha-value>)` 包裝，讓 Tailwind alpha 修飾子（`bg-accent/20` 等）能正常運作。先前自己訊息氣泡消失即此問題。**此格式不可再改回 hex**。
- **2026-04-25（同日 follow-up）**：`double-down.svg`（捲到最新箭頭）改為 `fill="currentColor"`，淺色模式可見。Trigger 1 加註 inline SVG 檢查項。
- **2026-04-25（文件重構）**：文件結構重整為 A/B/C/D/E/F 四區，新增 C「元件表」按 UI 表面分類列出所有已 token 化元件，避免下次漏改。
- **2026-04-25（新增 Trigger 5）**：明文規定**新增 UI 元件 / 頁面**時必須同 commit 更新 C 元件表 + 走 token 系統。例外：純臨時頁面（OAuth redirect 等）。CLAUDE.md 觸發詞同步更新。
- **2026-04-25（更名 + 新增 Trigger 6）**：檔案從 `COLOR_SYSTEM.md` 改名為 `DESIGN_SYSTEM.md`（範疇從色彩擴大到完整設計系統）。新增 Trigger 6「優先複用既有元件」：新建畫面前先掃 C 表找最近既有元件複用，避免重新發明 Modal / Sheet / Picker 等通用外殼造成體感不一致。CLAUDE.md 同步更新引用名稱。
