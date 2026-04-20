# [2-2] Session 列表項目 (Session Item)

單一頻道或私訊的列表項目。

- **ID**：`2-2`
- **對應檔案**：`src/routes/chat/SessionList/Session.tsx`
- **依賴 token**：`color.bg.surface`, `color.border.default`, `color.text.primary`, `color.text.muted`, `color.text.disabled`, `color.accent.teal-300`, `radius.md`
- **相關元件**：[2-3] Avatar

## 視覺規格

容器：
- padding：`9px 12px`，margin：`2px 8px`（橫向縮進）
- `border-radius: 6px`
- gap 10px

內容：
- Avatar（[2-3]）：28×28px — channel: rounded-md / user: rounded-full
- Name：`Inter 500 / 15px`，`color: #e4e4e7`，truncate
- Preview：`Inter 400 / 13px`，`color: #52525b`，truncate
- Badge（未讀）：`font-mono 600 / 11px`，`bg: #5eead4`，`color: #042f2e`，padding `1px 6px`，`rounded-sm`

## 狀態

| State | 變化 |
|---|---|
| default | 無背景 |
| hover | `bg: #0f1014` |
| active | `bg: #141519` + `box-shadow: inset 0 0 0 1px #27272a` |
| muted (靜音) | 右側加 🔕 icon（14px, `color: #3f3f46`）；name `color: #71717a` |
| unread | 顯示 badge |

## 群組標題

- 區塊上方有 `SECTION LABEL`（例：`CHANNELS`, `DIRECT MESSAGES`）
- 樣式：`font-mono 11px / 600`，`color: #3f3f46`，`letter-spacing: 0.14em`，uppercase
- padding: `16px 16px 8px`

## Props

```ts
interface SessionItemProps {
  type: 'channel' | 'dm';
  name: string;
  lastMessagePreview?: string;     // 例："Adam: 這個介面我想改"
  unreadCount?: number;
  isActive: boolean;
  isMuted?: boolean;
  avatarProps: AvatarProps;        // 見 [2-3]
  onClick: () => void;
  onContextMenu?: (e) => void;     // 右鍵選單 [4-3]
}
```

## Tailwind 對照

```html
<button data-active="true"
  class="mx-2 my-0.5 flex items-center gap-2.5 rounded-md px-3 py-[9px]
         hover:bg-[#0f1014]
         data-[active=true]:bg-bg-surface
         data-[active=true]:shadow-[inset_0_0_0_1px_#27272a]">
  <Avatar type="channel" name="general" size="sm" />
  <div class="min-w-0 flex-1">
    <div class="truncate text-[15px] font-medium text-[#e4e4e7]">general</div>
    <div class="truncate text-[13px] text-fg-subtle mt-px">Adam: 這個介面我想改</div>
  </div>
  {unreadCount && (
    <span class="rounded-sm bg-accent-300 px-1.5 py-px
                 font-mono text-[11px] font-bold text-teal-950">3</span>
  )}
</button>
```

## 修改提示

- 這是最常被掃視的元件之一。保持資訊密度（title + preview + badge 三行資訊不要膨脹）。
- 不要加漸層、不要加陰影（除了 active 的 inset hairline）。
