# [4-4] Modal 框架 (Modal Shell)

所有彈出視窗共用的底層框架。**改這個影響全部 Modal。**

- **ID**：`4-4`
- **對應檔案**：`src/components/Modal.tsx`
- **依賴 token**：`color.bg.overlay`, `color.bg.elevated`, `color.border.default`, `color.border.subtle`, `color.text.primary`, `color.text.muted`, `radius.xl`, `shadow.overlay`

## 視覺規格

### Overlay

- 覆蓋整個視窗
- `background: rgba(0, 0, 0, 0.7)`（或 `#000000b3`）
- **不加 backdrop-filter**（Linear 不做玻璃感）
- click overlay 關閉 modal

### 容器

- max-width 視內容決定（360/440/520）
- `background: #0c0d10`
- `border: 1px solid #27272a`
- `border-radius: 10px`
- `box-shadow: 0 20px 50px #00000080`
- overflow hidden

### Header

- padding `16px 20px`
- `border-bottom: 1px solid #18191d`
- display flex / justify-between
- 左：`Inter 600 / 17px`，`color: #f4f4f5`
- 右：關閉 X，`color: #52525b`，cursor pointer，hover `color: #a1a1aa`

### Body

- padding `18px`
- `font-size: 14.5px`, `color: #a1a1aa`, `line-height: 1.6`

### Footer

- padding `12px 18px`
- `border-top: 1px solid #18191d`
- display flex / justify-end / gap 8px

### 按鈕

| variant | bg | text | border |
|---|---|---|---|
| primary | `#5eead4` | `#042f2e` | — |
| danger | `#ef4444` | `#fff` | — |
| secondary | transparent | `#a1a1aa` | `1px solid #27272a` |

- padding：`8px 16px`
- `rounded-md`
- `font-size: 14px`, `font-weight: 600`

## Keyboard / Behaviour

- `Esc` → 關閉
- focus trap 在 modal 內
- 進入時 `opacity 0 → 1`，duration 180ms（不用 scale 動畫）
- 離開時 duration 120ms

## Props

```ts
interface ModalShellProps {
  title: string;
  onClose: () => void;
  maxWidth?: number;
  children: ReactNode;         // body
  footer?: ReactNode;          // 按鈕群，若無則 footer 區塊不 render
}
```

## Tailwind 對照

```html
<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70" on:click="close">
  <div class="w-[360px] overflow-hidden rounded-[10px] border border-border
              bg-bg-elevated shadow-[0_20px_50px_#00000080]" on:click.stop>
    <header class="flex items-center justify-between border-b border-border-subtle px-5 py-4">
      <h2 class="text-[17px] font-semibold text-fg-primary">確認刪除頻道</h2>
      <button class="text-fg-subtle hover:text-fg-secondary" on:click="close">✕</button>
    </header>
    <div class="p-[18px] text-[14.5px] leading-relaxed text-fg-secondary">
      此操作無法復原，頻道內所有訊息都將被刪除。
    </div>
    <footer class="flex justify-end gap-2 border-t border-border-subtle px-5 py-3">
      <button class="rounded-md border border-border px-4 py-2 text-[14px]
                     font-semibold text-fg-secondary hover:border-border-strong">取消</button>
      <button class="rounded-md bg-red-500 px-4 py-2 text-[14px] font-semibold text-white">刪除</button>
    </footer>
  </div>
</div>
```

## 修改提示

- **不要加** backdrop-filter / blur。
- **不要加** 進場 scale 動畫（只用 opacity fade）。
- 改 border-radius 會影響所有 modal；要改請確認影響範圍。
