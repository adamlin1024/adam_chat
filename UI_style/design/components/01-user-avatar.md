# [1-1] 帳號頭像 (User Avatar)

左側 icon 欄頂部，顯示目前登入用戶的頭像縮寫與在線狀態。

- **ID**：`1-1`
- **對應檔案**：`src/routes/home/User.tsx`
- **依賴 token**：`color.accent.teal-300`, `color.accent.teal-on`, `color.semantic.online`, `color.bg.app`, `radius.pill`
- **相關元件**：[2-3] Avatar（共用底層）、[4-1] 個人資料卡（點擊開啟）

## 視覺規格

- 容器：36×36px，`border-radius: 50%`
- 背景：漸層 `linear-gradient(135deg, #5eead4, #06b6d4)`
- 文字：縮寫 1 字母，`Inter 700 / 15px`，`color: #042f2e`
- 狀態圓點：10×10px，`#4ade80`，位於右下 -2/-2，2px 邊框 `#08090b`
- 外層點擊區：44×44px（hit target）

## 狀態

| State | 變化 |
|---|---|
| default | 預設 |
| hover | 外層 `box-shadow: inset 0 0 0 1px #27272a`；cursor pointer |
| offline | 狀態圓點改 `#52525b` |
| idle | 狀態圓點改 `#fbbf24` |

## Props（React）

```ts
interface UserAvatarProps {
  name: string;              // 取首字當縮寫
  imageUrl?: string;         // 有則顯示圖，無則顯示縮寫
  status: 'online' | 'idle' | 'offline';
  onClick: () => void;       // 開啟個人資料卡 [4-1]
}
```

## Tailwind 對照

```html
<button class="relative flex h-9 w-9 items-center justify-center rounded-full
               bg-gradient-to-br from-teal-300 to-cyan-500
               text-[15px] font-bold text-teal-950">
  A
  <span class="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full
               bg-green-400 ring-2 ring-[#08090b]"></span>
</button>
```

## 修改提示

- 若改主色（accent），連帶檢查 [1-2] active 狀態、[3-2] 訊息名稱、[2-3] avatar fallback。
- 此元件只放在 icon 欄頂部；app 其他頭像用 [2-3] Avatar。
