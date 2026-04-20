# [1-2] 主導航 Icon (Main Nav)

左側 icon 欄的導航按鈕群組：聊天、成員、收藏、檔案（管理員）。

- **ID**：`1-2`
- **對應檔案**：`src/routes/home/index.tsx`
- **依賴 token**：`color.bg.surface`, `color.border.default`, `color.accent.teal-300`, `color.text.subtle`, `color.text.secondary`, `radius.lg`

## 視覺規格

- 每顆按鈕：32×32px，`border-radius: 8px`
- Icon：16×16 SVG，stroke 1.6px，`color: #52525b`（預設）
- Active：`background: #18191d`，`box-shadow: inset 0 0 0 1px #27272a`，icon `color: #5eead4`
- 按鈕之間 gap：4px

## 狀態

| State | 變化 |
|---|---|
| default | icon `#52525b` / 無背景 |
| hover | icon `#a1a1aa` / 無背景 |
| active | icon `#5eead4` / bg `#18191d` / hairline 外框 |
| disabled | icon `#3f3f46`，cursor not-allowed |

## Nav 項目（由上而下）

1. **chat** (聊天) — 三條橫線（訊息列圖示）
2. **members** (成員) — 人像圖示
3. **bookmark** (收藏) — 書籤圖示
4. **files** (檔案) — 文件圖示，**只有 admin 可見**

## Props

```ts
interface MainNavProps {
  activeRoute: 'chat' | 'members' | 'bookmark' | 'files';
  isAdmin: boolean;          // 決定是否顯示 files
  onNavigate: (route: string) => void;
}
```

## Tailwind 對照

```html
<!-- single button -->
<button class="flex h-8 w-8 items-center justify-center rounded-lg
               text-fg-subtle transition-colors duration-[120ms]
               hover:text-fg-secondary
               data-[active=true]:bg-bg-surface
               data-[active=true]:text-accent-300
               data-[active=true]:shadow-[inset_0_0_0_1px_#27272a]">
  <svg width="15" height="15" stroke="currentColor" stroke-width="1.6" fill="none">...</svg>
</button>
```

## 修改提示

- 新增一顆 nav 按鈕：加 SVG icon（必須 line-style，stroke 1.6px）、對應 route、更新 Props 型別。
- Hit target 可擴大到 40×40（外層 padding），但視覺上仍是 32×32。
