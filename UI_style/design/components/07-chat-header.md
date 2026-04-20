# [3-1] 聊天室 Header

聊天主區頂部。頻道版 vs DM 版兩種顯示。

- **ID**：`3-1`
- **對應檔案**：`src/routes/chat/ChannelChat/index.tsx`
- **依賴 token**：`color.bg.canvas`, `color.border.subtle`, `color.border.default`, `color.text.primary`, `color.text.subtle`, `color.text.disabled`, `color.semantic.online`

## 視覺規格

- 高度：56px（`layout.chat-header-height`）
- padding：`0 24px`
- `border-bottom: 1px solid #18191d`
- gap 10px

### 頻道版

- `#` 前綴：mono，`color: #52525b`
- 頻道名：`Inter 600 / 16px`，`color: #f4f4f5`，`letter-spacing: -0.01em`
- 成員數：`font-mono 11px / #3f3f46 / 0.14em caps`（例：`5 MEMBERS`）
  - 與頻道名之間 `padding-left: 10px` + `border-left: 1px solid #27272a`

### DM 版

- Avatar (sm, 32px)
- 對方名字：同頻道名樣式
- 在線狀態：`● 在線` 或 `● 離線`，`font-mono 11px`
  - 在線：`#4ade80`；離線：`#52525b`

### 右側操作按鈕

- 每顆 30×30px，`border: 1px solid #27272a`，`rounded-md`，icon stroke 1.4px `#52525b`，icon 14px
- gap: 4px
- hover: `border-color: #3f3f46`，icon `#a1a1aa`

預設按鈕：搜尋 ⌕ / 成員列表 👥 / 設定 ⚙

## Props

```ts
interface ChatHeaderProps {
  type: 'channel' | 'dm';
  // channel
  channelName?: string;
  memberCount?: number;
  // dm
  partner?: { name: string; avatarProps: AvatarProps; status: 'online'|'idle'|'offline' };
  // actions
  onSearch: () => void;
  onOpenMembers?: () => void;
  onSettings?: () => void;
}
```

## Tailwind 對照（頻道版）

```html
<header class="flex h-14 flex-shrink-0 items-center gap-2.5 border-b border-border-subtle px-6">
  <span class="font-mono text-fg-subtle">#</span>
  <span class="text-[16px] font-semibold tracking-tight text-fg-primary">general</span>
  <span class="border-l border-border pl-2.5 ml-0.5
               font-mono text-[11px] tracking-[0.14em] uppercase text-fg-disabled">
    5 members
  </span>
  <div class="ml-auto flex gap-1">
    <button class="flex h-[30px] w-[30px] items-center justify-center rounded-md
                   border border-border text-fg-subtle hover:text-fg-secondary
                   hover:border-border-strong">
      <SearchIcon class="w-3.5 h-3.5" />
    </button>
    <!-- ... -->
  </div>
</header>
```

## 修改提示

- `MEMBERS` 文字全大寫是風格特徵；不要改小寫。
- 右側按鈕是可擴充的；新按鈕加在陣列末尾。
