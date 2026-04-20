# [3-3] 訊息輸入框 (Message Input)

聊天室底部輸入區。使用 Plate.js 富文字編輯器。

- **ID**：`3-3`
- **對應檔案**：`src/components/MessageInput/index.tsx`
- **依賴 token**：`color.bg.sidebar`, `color.border.default`, `color.border.strong`, `color.text.subtle`, `color.accent.teal-300`, `color.accent.teal-on`, `radius.lg`

## 視覺規格

### 外層

- padding：`14px 24px 20px`
- 無 border-top（與訊息區靠 gap 自然隔開）

### 輸入框

- `background: #0c0d10`
- `border: 1px solid #27272a`，`rounded-lg` (8px)
- padding `12px 14px`
- 內層 flex gap 10px
- focus 時：`border-color: #3f3f46`（不用 outline）

內容由左至右：

1. **附件按鈕** `+`：`w-[26px] h-[26px]`，`color: #52525b`，字體 16px
2. **Placeholder / 輸入區**：flex-1，`font-size: 14.5px`，`color: #52525b`（placeholder）／ `#d4d4d8`（有內容時）
3. **表情按鈕** ☺：同附件
4. **發送按鈕**：
   - `background: #5eead4`
   - `color: #042f2e`
   - padding `5px 12px`，`rounded-sm`
   - 文字：`font-mono 12px / 700`，內容：`SEND ↵`
   - disabled（無輸入）：`bg: #18191d`, `color: #3f3f46`

### 鍵盤提示

- 輸入框下方，margin-top 6px
- `font-mono 11px`，`color: #3f3f46`，`letter-spacing: 0.05em`
- 內容：`ENTER 發送 · SHIFT+ENTER 換行`

## 狀態

| State | 變化 |
|---|---|
| idle | border `#27272a` |
| focus | border `#3f3f46` |
| disabled | border `#18191d`，placeholder `#3f3f46` |
| markdown mode | 左側顯示 `MD` mono tag，`border: 1px solid #27272a`, padding `1px 5px` |
| uploading attachment | 附件區顯示檔名 chip（border default, 10.5px）|

## Props

```ts
interface MessageInputProps {
  placeholder: string;          // "輸入訊息到 #general"
  value: string;
  onChange: (val: string) => void;
  onSend: () => void;
  onAttach: () => void;
  onEmoji: () => void;
  isMarkdownMode?: boolean;
  onToggleMarkdown?: () => void;
  disabled?: boolean;
}
```

## Tailwind 對照

```html
<div class="px-6 pt-[14px] pb-5">
  <div class="flex items-center gap-2.5 rounded-lg border border-border bg-bg-sidebar
              px-3.5 py-3 focus-within:border-border-strong transition-colors">
    <button class="h-[26px] w-[26px] text-[16px] text-fg-subtle hover:text-fg-secondary">+</button>
    <input class="flex-1 bg-transparent text-[14.5px] text-fg-body
                  placeholder:text-fg-subtle outline-none"
           placeholder="輸入訊息到 #general" />
    <button class="h-[26px] w-[26px] text-[16px] text-fg-subtle hover:text-fg-secondary">☺</button>
    <button class="rounded-sm bg-accent-300 px-3 py-[5px]
                   font-mono text-[12px] font-bold text-teal-950">
      SEND ↵
    </button>
  </div>
  <div class="mt-1.5 font-mono text-[11px] tracking-wider text-fg-disabled">
    ENTER 發送 · SHIFT+ENTER 換行
  </div>
</div>
```

## 修改提示

- Plate.js 整合點在這個 `<input>` 位置；實際要用 Plate 的 editor element 替換。
- **不要**用圓形送出按鈕（會破壞方形節奏）。
