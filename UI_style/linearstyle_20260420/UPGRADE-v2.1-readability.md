# Upgrade v2.1 — Readability Patch（對齊 LINE 閱讀尺度）

**任務目的**：提升全站字級與 icon/avatar 尺寸，讓閱讀體感接近 LINE。
**適用版本**：v2.0 → v2.1
**執行者**：Claude Code（讀完即可整批執行，不需逐項確認）

---

## 一、數值變更總表（背起來，之後都用這套）

### 字級（最重要）

| 用途 | 舊值 | **新值** | Tailwind 類別建議 |
|---|---|---|---|
| 訊息正文 | 13px | **15px** | `text-[15px]` · line-height 1.55 |
| 使用者名稱（訊息/ header / session） | 12.5–13.5px | **15px** | `text-[15px]` · font-semibold |
| Session 列表預覽文字 | 10.5px | **13px** | `text-[13px]` |
| 聊天室 header 頻道名 | 13.5px | **16px** | `text-[16px]` · font-semibold |
| DM header 對方名 | 13.5px | **16px** | `text-[16px]` |
| 時間戳（訊息旁） | 10px mono | **12px mono** | `font-mono text-[12px]` |
| Session header 組織名 | 13px | **15px** | `text-[15px]` · font-semibold |
| Input 內文字/placeholder | 12.5px | **14.5px** | `text-[14.5px]` |
| Modal title / Login title | 14px / 16px | **17px** | `text-[17px]` · font-semibold |
| Section label（mono caps） | 9–10px | **11px** | `font-mono text-[11px]` · keep caps |
| Reaction chip | 10.5px | **12px** | `text-[12px]` |
| Role / badge chip（mono） | 9.5–10.5px | **11px** | `font-mono text-[11px]` |
| SEND 按鈕文字 | 10.5px | **12px** | `font-mono text-[12px]` |
| 鍵盤提示 | 9.5px | **11px** | `font-mono text-[11px]` |
| Context menu 項目 | 12px | **14px** | `text-[14px]` |
| Context menu 快捷鍵 | 10px | **11.5px** | `font-mono text-[11.5px]` |
| Members page 標題 `所有成員 (N)` | 18px | **20px** | `text-[20px]` · font-bold |
| Email/meta mono | 10.5px | **12px** | `font-mono text-[12px]` |

### 高度與 icon

| 用途 | 舊值 | **新值** |
|---|---|---|
| 聊天室 Header 高度 | 48px | **56px** |
| Session item padding-Y | 7px | **9px**（讓列高增） |
| Icon bar 寬度 | 56px | **60px** |
| Nav icon 按鈕 | 32×32 | **36×36** |
| Nav icon 本身 | 15px | **18px** |
| Chat header 右側按鈕 | 26×26 | **30×30** |
| Input send 按鈕 padding | `3px 10px` | **`5px 12px`** |
| Avatar sm | 28 | **32** |
| Avatar md | 32 | **36** |
| Avatar lg | 36 | **40** |
| Avatar xl | 48 | **52** |
| Session item avatar | 24 | **28** |
| Message avatar | 30 | **36** |

### Line-height / 間距微調

- 訊息正文 line-height：`1.5` → **`1.55`**
- 訊息之間 gap：`14px` → **`16px`**
- Session item margin-Y：`1px` → **`2px`**
- Session section label padding：`14px 16px 6px` → **`16px 16px 8px`**

---

## 二、Token 檔更新（`design/tokens.json`）

### `typography.size` 整個替換為：

```json
"size": {
  "xs":   { "value": "11px",   "line": "1.4",  "use": "section label (mono, uppercase) / keyboard hint" },
  "sm":   { "value": "12px",   "line": "1.5",  "use": "timestamp (mono) / badge / role chip / reaction" },
  "base": { "value": "14.5px", "line": "1.5",  "use": "input text / secondary body" },
  "md":   { "value": "15px",   "line": "1.55", "use": "訊息正文 / 使用者名稱 / session item name（★ 主體尺寸）" },
  "lg":   { "value": "16px",   "line": "1.4",  "use": "chat header title" },
  "xl":   { "value": "17px",   "line": "1.4",  "use": "modal title / login title" },
  "2xl":  { "value": "20px",   "line": "1.3",  "use": "page title（members / settings）" }
}
```

### `layout` 整個替換為：

```json
"layout": {
  "icon-bar-width":    "60px",
  "session-width":     "260px",
  "chat-header-height":"56px",
  "hit-target-min":    "36px",
  "density":           "comfortable"
}
```

（session 欄同步從 232px → 260px，讓預覽文字放大後不擠）

### `meta.version` → `"2.1.0"`
### `meta.style` 改為 `"Linear-inspired · sharp · LINE-readable"`

---

## 三、Tailwind snippet 更新（`design/tailwind.config.snippet.js`）

在 `theme.extend.fontSize` 下整個替換成：

```js
fontSize: {
  'xs-ds':    ['11px',   { lineHeight: '1.4' }],   // section label / keyboard hint
  'sm-ds':    ['12px',   { lineHeight: '1.5' }],   // timestamp / badge / reaction
  'base-ds':  ['14.5px', { lineHeight: '1.5' }],   // input text
  'md-ds':    ['15px',   { lineHeight: '1.55' }],  // ★ 訊息正文 / 名稱 / session name
  'lg-ds':    ['16px',   { lineHeight: '1.4' }],   // chat header
  'xl-ds':    ['17px',   { lineHeight: '1.4' }],   // modal / login title
  '2xl-ds':   ['20px',   { lineHeight: '1.3' }],   // page title
},
```

在 `theme.extend.spacing` 更新：

```js
spacing: {
  'icon-bar':     '60px',
  'session-bar':  '260px',
  'chat-header':  '56px',
  'hit-min':      '36px',
},
```

---

## 四、元件 MD 更新清單（逐檔覆蓋）

### `design/components/05-session-item.md`
- Avatar 24px → **28px**
- Name 12.5px → **15px**
- Preview 10.5px → **13px**
- Badge 9.5px → **11px**
- 容器 padding `7px 10px` → **`9px 12px`**
- Section label 9px → **11px**，padding `14px 16px 6px` → **`16px 16px 8px`**

### `design/components/08-message.md`（★ 最重要）
- 頭像 30px → **36px**
- 名字 12.5px → **15px**
- 時間 mono 10px → **mono 12px**
- 訊息正文 13px → **15px**，line-height 1.5 → **1.55**
- Reaction chip 10.5px → **12px**，padding `2px 8px` → **`3px 10px`**
- Quote name mono 10px → **mono 11.5px**
- Quote text 10.5px → **13px**
- 訊息間 gap 14px → **16px**
- Right-action 按鈕 24×24 → **28×28**

### `design/components/07-chat-header.md`
- 高度 48px → **56px**
- padding `0 20px` → **`0 24px`**
- 頻道名 13.5px → **16px**
- 成員數 mono 10px → **mono 11px**
- 右側按鈕 26×26 → **30×30**，icon 12px → **14px**
- DM 版 avatar 28 → **32**，在線 mono 10px → **mono 11px**

### `design/components/09-message-input.md`
- padding `12px 20px 16px` → **`14px 24px 20px`**
- 輸入框 padding `10px 12px` → **`12px 14px`**
- 輸入內文 12.5px → **14.5px**
- 附件/emoji icon 22×22 → **26×26**，font 13px → **16px**
- SEND 按鈕 mono 10.5px → **mono 12px**，padding `3px 10px` → **`5px 12px`**
- 鍵盤提示 mono 9.5px → **mono 11px**

### `design/components/04-session-header.md`
- `WORKSPACE` mono 9px → **mono 11px**
- 組織名 13px → **15px**
- `+` 按鈕 22×22 → **26×26**
- padding `14/16/12` → **`16/16/14`**

### `design/components/06-avatar.md`
- Size scale 全面上調：
  - xs 20 → **24**
  - sm 28 → **32**
  - md 32 → **36**
  - lg 36 → **40**
  - xl 48 → **52**
  - 2xl（新加）→ **64**（Profile card 用）

### `design/components/02-main-nav.md` & `03-bottom-menu.md`
- 按鈕 32×32 → **36×36**，rounded-lg 維持
- Icon 15px → **18px**，stroke 1.6 維持
- 上下 gap 4 → **6**

### `design/components/01-user-avatar.md`
- 32×32 → **36×36**
- 在線圓點 9px → **10px**，border 2px 維持
- Name 文字 13px → **15px**（若顯示）

### `design/components/12-context-menu.md`
- 項目 12px → **14px**
- 快捷鍵 mono 10px → **mono 11.5px**
- padding `7px 10px` → **`9px 12px`**
- Icon 14x14 → **16x16**
- min-width 180 → **200**

### `design/components/13-modal-shell.md`
- Header title 13.5px → **17px**
- Body 12.5px → **14.5px**
- Footer 按鈕 12px → **14px**，padding `6px 14px` → **`8px 16px`**
- Header padding `14px 18px` → **`16px 20px`**

### `design/components/10-profile-card.md`
- Banner 高 48 → **56**
- Avatar 48 → **64**（用新加的 2xl）
- Name 13px → **16px** font-semibold
- Status mono 10.5px → **mono 12px**
- 按鈕 12px → **14px**，padding 8 → **10**

### `design/components/11-invite-modal.md`
- 寬 340 → **380**
- Header 13.5px → **17px**
- Label mono 10.5px → **mono 12px**
- URL mono 11px → **mono 13px**
- COPY 按鈕 mono 10px → **mono 11.5px**

### `design/components/14-login.md` & `15-register.md`
- 卡片寬 320 → **360**
- Logo 40 → **48**，內字 17 → **20**
- H1 16 → **20**
- Sub mono 10.5 → **mono 12**
- Input 12.5 → **14.5**，padding `9px 12px` → **`11px 14px`**
- SIGN IN / CREATE ACCOUNT mono 11.5 → **mono 13**
- Alt button mono 10.5 → **mono 12**

### `design/components/16-members-page.md`
- padding `24px 32px` → **`32px 40px`**
- MEMBERS eyebrow mono 10 → **mono 12**
- H2 `所有成員 (N)` 18 → **20**
- 搜尋框 mono 10.5 → **mono 13**
- 列 padding-Y 10 → **12**
- Avatar 28 → **32**
- Name 13 → **15**
- Email mono 10.5 → **mono 12**
- Role chip mono 10.5 → **mono 11.5**

---

## 五、CLAUDE.md 更新

修改「核心設計規則 · 2. 字體」那段：

```markdown
### 2. 字體

- **預設**：Inter，`letter-spacing: -0.005em`，中文字型由系統回退（PingFang TC / Noto Sans TC）
- **Mono**：JetBrains Mono，用於 section label、timestamp、badge 數字、keyboard hint
- **粗細**：訊息正文 400 / 使用者名稱 600 / 標題 700
- **大小基準**（LINE-readable）：
  - 主體尺寸 **15px**（訊息正文、名稱、session 列表名）
  - 標題 **16–20px**
  - 輔助 mono / 時間 **11–12px**
  - 最小不低於 **11px**
```

以及在文末加一條：

```markdown
## Version History
- v2.0 (2026-04-20): 初始版本
- v2.1 (2026-04-20): 字級與尺寸全面對齊 LINE 閱讀體感
```

---

## 六、驗證步驟（Claude Code 執行完後做）

1. 開 app，訊息應該跟 LINE 差不多大
2. 側欄一眼能看清楚「名稱 + 預覽」兩行（不需瞇眼）
3. Chat header 頻道名明顯是主角，不被按鈕搶
4. Input placeholder 看起來像「可以打字的輸入框」而不是 hint
5. Icon 點擊不會誤觸相鄰目標

如果覺得某個地方還是偏小，按「訊息正文 15px」這個錨點等比例再加 1px 就夠了。不要為單一元件再往上調。
