# [5-3] 成員列表頁 (Members Page)

點擊左側 icon 欄「成員」進入。列出所有成員。

- **ID**：`5-3`
- **對應檔案**：`src/routes/users/`
- **依賴 token**：`color.bg.canvas`, `color.border.subtle`, `color.text.*`, `color.accent.teal-300`
- **相關元件**：[2-3] Avatar, [4-1] 個人資料卡（點擊成員時開）

## 視覺規格

### 頁面外框

- `background: #0a0b0e`
- padding：`24px 32px`
- max-width：860px，居中

### 頁面 Header

- display flex / justify-between / align-items baseline
- 左：
  - `font-mono 10px / #71717a / 0.14em caps`：`MEMBERS`
  - 下方：`Inter 700 / 18px / #f4f4f5`：`所有成員 (N)`
- 右：搜尋輸入框
  - width 240px
  - 同 [5-1] input 樣式
  - placeholder：`搜尋成員...`

- 下方 mt 20px，`border-bottom: 1px solid #18191d`

### 篩選列（可選）

- chip 按鈕：`全部 / 管理員 / 成員`
- 每個 chip：`border: 1px solid #27272a`, `rounded-sm`, `font-mono 10.5px`, padding `3px 10px`
- 選中：`border-color: #5eead430`, `bg: #5eead415`, `color: #5eead4`

### 成員列

- 格式：table-like，每列同高
- 每列 padding：`10px 0`
- `border-bottom: 1px solid #18191d`（最後一列不加）
- display grid：`auto 1fr auto auto`（avatar / info / role / action）
- gap 12px

#### 單列內容

1. **Avatar** `sm` (28px)
2. **Info 欄**：
   - name：`Inter 500 / 13px / #e4e4e7`
   - email：`font-mono 10.5px / #52525b`
3. **Role 標籤**：
   - 格式同 reaction chip
   - admin：`border-color: #5eead430`, `bg: #5eead415`, `color: #5eead4`
   - member：`border: 1px solid #27272a`, `color: #71717a`
   - 文字：`MEMBER` / `ADMIN`（mono caps 10.5px）
4. **更多操作** `⋯`：
   - 點開下拉選單（[4-3] 右鍵選單樣式）
   - 選項：查看個人資料 / 傳送私訊 / 修改權限（admin）/ 移除成員（admin, danger）

### Hover 狀態

- 整列 `bg: #0d0e11`

## Props

```ts
interface MembersPageProps {
  members: Member[];
  currentUserIsAdmin: boolean;
  onMemberClick: (id: string) => void;      // 開個人資料卡 [4-1]
  onChangeRole: (id: string, role: 'admin'|'member') => void;  // admin only
  onRemoveMember: (id: string) => void;     // admin only
}

interface Member {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
  status: 'online' | 'idle' | 'offline';
  avatarUrl?: string;
}
```

## Tailwind 對照（單列）

```html
<div class="group grid grid-cols-[auto_1fr_auto_auto] items-center gap-3
            border-b border-border-subtle py-2.5 hover:bg-[#0d0e11]">
  <Avatar size="sm" />
  <div class="min-w-0">
    <div class="truncate text-[13px] font-medium text-[#e4e4e7]">Adam</div>
    <div class="truncate font-mono text-[10.5px] text-fg-subtle">baker0169@gmail.com</div>
  </div>
  <span class="rounded-sm border border-accent-300/30 bg-accent-300/10 px-2 py-0.5
               font-mono text-[10.5px] text-accent-300">ADMIN</span>
  <button class="h-7 w-7 rounded-md text-fg-subtle hover:bg-bg-surface hover:text-fg-secondary">⋯</button>
</div>
```

## 修改提示

- Role 用英文 caps mono（`ADMIN` / `MEMBER`）比中文「管理員／成員」更符合 Linear 風。若堅持中文，用 `font-mono 10.5px` 即可。
- 大量成員時考慮虛擬滾動（react-window / virtua）。
- 搜尋是 client-side filter（name + email）；若成員數 > 500 要 server-side。
