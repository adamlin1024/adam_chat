# [2-1] Session Header

Session 欄頂部，顯示伺服器組織名稱與新增頻道按鈕。

- **ID**：`2-1`
- **對應檔案**：`src/routes/chat/SessionList/index.tsx`
- **依賴 token**：`color.bg.sidebar`, `color.border.subtle`, `color.text.primary`, `color.text.disabled`, `color.border.default`

## 視覺規格

- 高度：由內容決定（padding 16/16/14）
- 上方有一列 mono 小字：`WORKSPACE`（`color: #3f3f46`，`font-mono 11px`，`letter-spacing: 0.08em`）
- 組織名稱：`Inter 600 / 15px`，`color: #f4f4f5`，`letter-spacing: -0.01em`
- 右側 `+` 按鈕：26×26px，`border: 1px solid #27272a`，`rounded-md`，`color: #71717a`
- 底部 `border-bottom: 1px solid #18191d`

## 狀態

| State | 變化 |
|---|---|
| admin | 顯示 `+` 按鈕 |
| non-admin | 不顯示 `+` |
| + hover | `border-color: #3f3f46`, `color: #a1a1aa` |

## Props

```ts
interface SessionHeaderProps {
  workspaceName: string;
  isAdmin: boolean;
  onAddChannel: () => void;
}
```

## Tailwind 對照

```html
<header class="flex items-center justify-between border-b border-border-subtle
               px-4 pt-4 pb-3.5">
  <div>
    <div class="font-mono text-[11px] tracking-[0.08em] text-fg-disabled">WORKSPACE</div>
    <div class="text-[15px] font-semibold tracking-tight text-fg-primary">Adam_chat</div>
  </div>
  {isAdmin && (
    <button class="flex h-[26px] w-[26px] items-center justify-center
                   rounded-md border border-border text-fg-muted
                   hover:border-border-strong hover:text-fg-secondary">+</button>
  )}
</header>
```

## 修改提示

- `WORKSPACE` 是新加的 eyebrow label — 舊版沒有。若不想要這條可移除但建議保留，提升系統感。
- 修改組織名稱長度時注意 truncate；`+` 按鈕不可被擠掉。
