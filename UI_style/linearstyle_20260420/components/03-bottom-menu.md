# [1-3] 底部 Menu (Bottom Menu)

左側 icon 欄底部。新增頻道（+）與設定（齒輪，只有 admin 可見）。

- **ID**：`1-3`
- **對應檔案**：`src/routes/home/Menu.tsx`
- **依賴 token**：`color.text.subtle`, `color.border.default`, `radius.lg`

## 視覺規格

- 每顆按鈕同 [1-2] 主導航：32×32px, `rounded-lg`
- **新增頻道**：文字 `+`，`font-size: 18px`，`font-weight: 300`，`color: #52525b`
- **設定**：齒輪 icon，線條式，stroke 1.4px
- 兩顆按鈕 gap：4px
- 與主 nav 區塊之間用 `flex-1` spacer 推到底部

## 狀態

| State | 變化 |
|---|---|
| hover | `color: #a1a1aa`，cursor pointer |
| +(新增頻道) 只有 admin | 非 admin 隱藏（return null） |
| 設定 | 非 admin 隱藏 |

## Props

```ts
interface BottomMenuProps {
  isAdmin: boolean;
  onAddChannel: () => void;      // 開邀請 / 新增頻道 flow
  onOpenSettings: () => void;
}
```

## Tailwind 對照

```html
<div class="mt-auto flex flex-col items-center gap-1 pb-3.5">
  {isAdmin && (
    <button class="flex h-8 w-8 items-center justify-center rounded-lg
                   text-[18px] font-light text-fg-subtle hover:text-fg-secondary">
      +
    </button>
  )}
  {isAdmin && (
    <button class="flex h-8 w-8 items-center justify-center rounded-lg
                   text-fg-subtle hover:text-fg-secondary">
      <GearIcon />
    </button>
  )}
</div>
```

## 修改提示

- 此元件的 `+` 與 [2-1] Session Header 的 `+` 是不同入口，兩者都開「新增頻道 modal」但位置不同。
- 非 admin 時此區塊可能完全為空；保留 `<div>` 但不 render 內容。
