# Adam_chat · 設計系統（Linear 式）

給 Claude Code 的入口文件。本資料夾是這個通訊軟體 UI 的完整設計規格。**實作 UI 時，只看這裡的規格，不要憑記憶。**

---

## 風格定位

- **方向**：Linear 式 · 銳利、節制、資訊密度高
- **模式**：Dark only（不需支援 light mode）
- **基調**：近黑底色 + teal-300 (#5eead4) accent + hairline border + Inter / JetBrains Mono 混排
- **圓角**：小（4–10px）
- **動效**：克制；不加 spring、不加 glow

---

## 檔案結構

```
design/
  CLAUDE.md           ← 你正在看的這份（總覽、規則、任務流程）
  tokens.json         ← 所有設計 token（顏色、字體、間距、圓角）
  preview.html        ← 視覺預覽（人類看）
  components/
    01-user-avatar.md       [1-1] 帳號頭像
    02-main-nav.md          [1-2] 主導航 Icon
    03-bottom-menu.md       [1-3] 底部 Menu
    04-session-header.md    [2-1] Session Header
    05-session-item.md      [2-2] Session 列表項目
    06-avatar.md            [2-3] 通用 Avatar
    07-chat-header.md       [3-1] 聊天室 Header
    08-message.md           [3-2] 單一訊息
    09-message-input.md     [3-3] 訊息輸入框
    10-profile-card.md      [4-1] 個人資料卡
    11-invite-modal.md      [4-2] 邀請 Modal
    12-context-menu.md      [4-3] 右鍵選單
    13-modal-shell.md       [4-4] Modal 框架
    14-login.md             [5-1] 登入頁
    15-register.md          [5-2] 註冊頁
    16-members-page.md      [5-3] 成員列表頁
```

---

## 核心設計規則

這些規則適用於所有元件。每份 component md 只記該元件特有的差異。

### 1. 顏色使用

所有顏色從 `tokens.json` 取值，**不要自己開新色**。命名對應：

| 用途 | Token | 值 |
|---|---|---|
| App 外框 / icon 欄 | `color.bg.app` | `#08090b` |
| Session 欄 | `color.bg.sidebar` | `#0c0d10` |
| 主聊天區 | `color.bg.canvas` | `#0a0b0e` |
| Active / hover 狀態 | `color.bg.surface` | `#141519` |
| 分隔線 | `color.border.subtle` | `#18191d` |
| 按鈕 / input border | `color.border.default` | `#27272a` |
| 主色 accent | `color.accent.teal-300` | `#5eead4` |
| 主文字 | `color.text.primary` | `#f4f4f5` |
| 訊息正文 | `color.text.body` | `#d4d4d8` |

### 2. 字體

- **預設**：Inter，`letter-spacing: -0.005em`，中文字型由系統回退（PingFang TC / Noto Sans TC）
- **Mono**：JetBrains Mono，用於 section label、timestamp、badge 數字、keyboard hint
- **粗細**：訊息正文 400 / 使用者名稱 600 / 標題 700
- **大小**：12.5–13px 為主，不低於 10.5px

### 3. 圓角

- **button / tag / input**：`4–6px`
- **卡片 / modal / session item**：`8–10px`
- **user avatar**：pill (50%)
- **channel avatar**：`6px`（方形圓角）
- **icon nav 按鈕**：`8px`

### 4. 邊框與分隔

- 用 `border: 1px solid #18191d` 做面板間的主分隔
- 用 `box-shadow: inset 0 0 0 1px #27272a` 做 active 狀態的光暈（不是發光，是 hairline 外框）
- 不用 2px 以上邊框
- 不加陰影，除非是 modal（用 `shadow.overlay`）

### 5. 間距節奏

- 元件內 padding：`10/12/14/16`
- 元件間 gap：`4/8/12`
- 列表 item 垂直 padding：`7–9px`（compact）
- 訊息間 gap：`14px`

### 6. Active / Hover 狀態

- Active：底色換成 `#141519` + `inset 0 0 0 1px #27272a`（hairline）
- Hover：底色提 5%，文字從 `muted` → `secondary`
- 不使用 box-shadow glow
- 不使用動畫放大；transition 只動顏色和 border-color，時長 120ms

### 7. Icon

- 線條式，1.4–1.6px stroke
- 預設 `color: #52525b`（subtle），active `color: #5eead4`
- 大小：nav 15–16px / inline 14px / badge 12px
- 不使用填色 icon

### 8. Reaction / Chip

- 不用圓膠囊滿色背景
- 格式：`1px solid #27272a` + 透明底 + 10.5px text
- 自己按過的：`border-color: #5eead430`, `bg: #5eead415`, `color: #5eead4`

---

## 給 Claude Code 的工作流程

### 當使用者要你「實作某個元件」時

1. 先讀 `design/components/NN-xxx.md`（檔名有元件 ID）
2. 讀 `design/tokens.json` 取得精確的顏色、字體、間距值
3. **對照每個元件 md 的「Tailwind 對照」區塊**把規格轉成 class
4. 檢查「對應檔案」區塊提到的 .tsx 路徑，修改該檔案
5. 若需要加新 token，**先問使用者**再加

### 當使用者要你「改設計風格」時

改動順序：
1. 先改 `tokens.json` 的值
2. 再改對應的元件 md（只有視覺描述需要同步）
3. 最後改 .tsx code

### 當使用者要你「新增元件」時

1. 在 `design/components/` 新增一份 md，照其他元件的結構格式
2. 給新的 ID（格式：`區塊號-編號`，例如 `3-4`）
3. 在這份 `CLAUDE.md` 的檔案結構區塊補上
4. 若需要新 token，更新 `tokens.json`

---

## 對應的 Code Base 結構（既有）

```
src/
  routes/
    home/
      index.tsx          → [1-2] 主導航
      User.tsx           → [1-1] 帳號頭像
      Menu.tsx           → [1-3] 底部 Menu
    chat/
      SessionList/
        index.tsx        → [2-1] Session Header
        Session.tsx      → [2-2] Session 列表項目
      ChannelChat/
        index.tsx        → [3-1] 聊天室 Header
    login/               → [5-1] 登入頁
    reg/                 → [5-2] 註冊頁
    users/               → [5-3] 成員列表頁
  components/
    Avatar.tsx           → [2-3] Avatar
    Message/
      index.tsx          → [3-2] 單一訊息
      ContextMenu.tsx    → [4-3] 右鍵選單
    MessageInput/
      index.tsx          → [3-3] 訊息輸入框
    Profile/             → [4-1] 個人資料卡
    InviteModal/         → [4-2] 邀請 Modal
    Modal.tsx            → [4-4] Modal 框架
```

---

## Tailwind 設定建議

如需把 tokens.json 映射到 Tailwind config，對應關係如下：

```js
// tailwind.config.js 片段
colors: {
  bg:      { app:'#08090b', sidebar:'#0c0d10', canvas:'#0a0b0e', surface:'#141519' },
  border:  { subtle:'#18191d', DEFAULT:'#27272a', strong:'#3f3f46' },
  fg:      { primary:'#f4f4f5', body:'#d4d4d8', secondary:'#a1a1aa', muted:'#71717a', subtle:'#52525b' },
  accent:  { 300:'#5eead4', 400:'#2dd4bf', 500:'#14b8a6' },
}
```

然後元件 md 裡的 Tailwind 對照會寫 `bg-bg-canvas` / `text-fg-body` / `border-border-subtle`，語意清楚。
