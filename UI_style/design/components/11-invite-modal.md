# [4-2] 邀請 Modal

邀請新成員加入頻道的彈出視窗。產生一次性邀請連結。

- **ID**：`4-2`
- **對應檔案**：`src/components/InviteModal/`
- **依賴 token**：同 [4-4] Modal 框架 + `color.accent.teal-300`, `color.border.default`

## 視覺規格

基於 [4-4] Modal 框架。

- 寬度：380px
- header：`邀請成員加入 #{channelName}`（`Inter 600 / 17px`）
- body 結構：
  - Label：`font-mono 12px / #71717a / 0.08em`，例：`INVITE LINK`
  - URL 顯示框：
    - `bg: #08090b`, `border: 1px solid #27272a`, `rounded-md`
    - padding `8px 10px`
    - 左側 URL 文字：`font-mono 13px`, `color: #a1a1aa`, truncate
    - 右側「複製」按鈕：
      - `bg: #5eead4`, `color: #042f2e`
      - `font-mono 11.5px / 700`
      - padding `4px 10px`, `rounded-sm`
  - 有效期資訊：`font-mono 11px / #52525b`，下方 mt 8px
    - 例：`有效期 24H · 最多 10 次使用`
  - 有效期 selector（可選）：兩個按鈕 chip，選中者 `border-color: #5eead430`, `bg: #5eead415`, `color: #5eead4`

- footer：
  - 「產生新連結」次按鈕：`border: 1px solid #27272a`, `color: #a1a1aa`
  - 「完成」主按鈕：`bg: #5eead4`, `color: #042f2e`

## Props

```ts
interface InviteModalProps {
  channelName: string;
  inviteUrl: string;
  expiresInHours: number;
  maxUses: number;
  onRegenerate: () => Promise<void>;
  onClose: () => void;
}
```

## Tailwind 對照（僅 body 片段）

```html
<div class="flex flex-col gap-3 p-5">
  <div class="font-mono text-[10.5px] tracking-[0.08em] text-fg-muted">INVITE LINK</div>
  <div class="flex items-center justify-between gap-2 rounded-md border border-border
              bg-bg-app px-2.5 py-2">
    <span class="truncate font-mono text-[11px] text-fg-secondary">
      localhost:3001/?magic_t=...
    </span>
    <button class="rounded-sm bg-accent-300 px-2 py-[3px]
                   font-mono text-[10px] font-bold text-teal-950">
      COPY
    </button>
  </div>
  <div class="font-mono text-[10px] text-fg-subtle">
    有效期 24H · 最多 10 次使用
  </div>
</div>
```

## 修改提示

- 「複製」文案可中英（`複製` / `COPY`）；此規格用英文 mono 更符合 Linear 調性，最終看 app 語言偏好。
- 點複製按鈕成功後改為 `COPIED ✓` 並維持 1.5s。
