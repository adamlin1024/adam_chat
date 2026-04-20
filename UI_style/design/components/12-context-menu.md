# [4-3] 右鍵選單 (Context Menu)

右鍵點擊訊息或 Session 後出現的操作選單。

- **ID**：`4-3`
- **對應檔案**：`src/components/Message/ContextMenu.tsx`
- **依賴 token**：`color.bg.elevated`, `color.border.default`, `color.text.secondary`, `color.text.subtle`, `color.semantic.danger`, `radius.lg`, `shadow.dropdown`

## 視覺規格

### 容器

- 寬度：200px（auto 也可）
- `background: #0c0d10`
- `border: 1px solid #27272a`
- `border-radius: 8px`
- `box-shadow: 0 8px 24px #00000066`
- `padding: 4px`
- overflow hidden

### 選項

每項：
- display flex / align-items center / gap 8px
- padding `9px 12px`
- `border-radius: 4px`
- `font-size: 14px`, `color: #a1a1aa`
- icon 16×16, `color: #52525b`, stroke 1.4px
- 右側可有 mono shortcut：`font-mono 11.5px / #3f3f46`（例：`⌘E`）

hover：
- `bg: #141519`
- text `color: #f4f4f5`
- icon `color: #a1a1aa`

### 分隔線

- `height: 1px`, `background: #18191d`, `margin: 4px 0`

### Danger 項目（刪除）

- text `color: #f87171`
- icon `color: #f87171`
- hover `bg: #f8717115`

## 選單內容

### Message 選單

| icon | label | shortcut |
|---|---|---|
| reply | 回覆 | R |
| edit | 編輯訊息 | E（僅自己的訊息） |
| share | 轉發 | — |
| pin | 固定訊息 | — |
| copy | 複製文字 | ⌘C |
| — 分隔 — | | |
| trash | 刪除訊息（danger） | ⌫（admin 或自己） |

### Session 選單

| label |
|---|
| 標記已讀 |
| 靜音 / 取消靜音 |
| 固定到頂部 |
| — 分隔 — |
| 刪除頻道（danger，admin only） |

## Props

```ts
interface ContextMenuProps {
  items: Array<
    | { type: 'item'; icon: ReactNode; label: string; shortcut?: string; danger?: boolean; onClick: () => void; disabled?: boolean }
    | { type: 'separator' }
  >;
  position: { x: number; y: number };
  onClose: () => void;
}
```

## Tailwind 對照

```html
<ul class="min-w-[200px] rounded-lg border border-border bg-bg-elevated p-1
           shadow-[0_8px_24px_#00000066]">
  <li class="flex items-center gap-2 rounded-sm px-3 py-[9px] text-[14px]
             text-fg-secondary hover:bg-bg-surface hover:text-fg-primary">
    <ReplyIcon class="h-4 w-4 text-fg-subtle" />
    <span class="flex-1">回覆</span>
    <span class="font-mono text-[11.5px] text-fg-disabled">R</span>
  </li>
  <!-- separator -->
  <li class="my-1 h-px bg-border-subtle"></li>
  <!-- danger -->
  <li class="flex items-center gap-2 rounded-sm px-3 py-[9px] text-[14px]
             text-red-400 hover:bg-red-500/10">
    <TrashIcon class="h-4 w-4" />
    <span class="flex-1">刪除訊息</span>
  </li>
</ul>
```

## 修改提示

- **不用 icon 文字混排時 icon 留置但用佔位**（不要左邊沒 icon 右邊有，造成文字不對齊）。
- 鍵盤導航：`ArrowUp/Down` 切換、`Enter` 執行、`Esc` 關閉。
