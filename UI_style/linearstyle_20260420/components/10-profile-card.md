# [4-1] 個人資料卡 (Profile Card)

點擊任何用戶頭像後彈出的浮動卡片。

- **ID**：`4-1`
- **對應檔案**：`src/components/Profile/`
- **依賴 token**：`color.bg.elevated`, `color.border.subtle`, `color.border.default`, `color.accent.teal-300`, `radius.lg`, `shadow.overlay`
- **相關元件**：[2-3] Avatar, [4-4] Modal 框架（定位邏輯共用 popover 版本）

## 視覺規格

- 寬度：220px
- `background: #0c0d10`
- `border: 1px solid #27272a`
- `border-radius: 10px`
- `box-shadow: 0 20px 50px #00000080`
- overflow hidden

### 結構（由上而下）

1. **Banner 區**：高度 48px，`background: #141519`（**不使用漸層**）
2. **Avatar 區**：
   - Avatar xl (48px)，margin-top -24px，`border: 3px solid #0c0d10` 切開 banner
   - padding 左 14px
3. **資料區** (padding `0 14px 14px`)：
   - Name：`Inter 700 / 13px`，`color: #f4f4f5`，mt 8px
   - Status：`font-mono 10.5px`，`color: #71717a`，例：`管理員 · 在線`
   - 在線點：用 inline `● ` + `color: #4ade80`
4. **操作區**：
   - 主按鈕「傳送訊息」：
     - mt 10px
     - width 100%，padding 8px
     - `bg: #5eead4`, `color: #042f2e`
     - `font-size: 12px`, `font-weight: 700`
     - `rounded-md`
   - admin 額外選項：「修改暱稱」，以純文字按鈕呈現 `font-mono 10.5px / #71717a`

## Props

```ts
interface ProfileCardProps {
  user: { id: string; name: string; role: 'admin'|'member'; status: 'online'|'idle'|'offline' };
  currentUserIsAdmin: boolean;
  anchorRect: DOMRect;            // 用於定位
  onClose: () => void;
  onSendMessage: () => void;
  onEditNickname?: () => void;    // admin only
}
```

## Tailwind 對照

```html
<div class="w-[220px] overflow-hidden rounded-[10px] border border-border
            bg-bg-elevated shadow-[0_20px_50px_#00000080]">
  <div class="h-12 bg-bg-surface"></div>
  <div class="px-3.5 pb-3.5">
    <Avatar size="xl" class="-mt-6 ring-[3px] ring-bg-elevated" />
    <div class="mt-2 text-[13px] font-bold text-fg-primary">Adam</div>
    <div class="font-mono text-[10.5px] text-fg-muted">
      管理員 · <span class="text-green-400">● 在線</span>
    </div>
    <button class="mt-2.5 w-full rounded-md bg-accent-300 py-2
                   text-[12px] font-bold text-teal-950">
      傳送訊息
    </button>
    {isAdmin && (
      <button class="mt-2 w-full font-mono text-[10.5px] text-fg-muted hover:text-fg-secondary">
        修改暱稱
      </button>
    )}
  </div>
</div>
```

## 修改提示

- **Banner 不做漸層**（舊版的青色漸層 banner 不保留；Linear 風格要 flat）。
- 定位邏輯可用 floating-ui / Popper。
