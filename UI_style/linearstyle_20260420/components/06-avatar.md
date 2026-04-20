# [2-3] 通用 Avatar

App 所有頭像顯示位置共用元件。

- **ID**：`2-3`
- **對應檔案**：`src/components/Avatar.tsx`
- **依賴 token**：`color.avatar-fallback.*`, `radius.pill`, `radius.md`

## 類型

| type | 形狀 | 用於 |
|---|---|---|
| `user` | pill (50%) | 使用者頭像 |
| `channel` | rounded-md (6px) | 頻道（#） |

## 尺寸

| size | 像素 | 文字大小 | 用於 |
|---|---|---|---|
| `xs` | 24 | 11px | session item 內 |
| `sm` | 28 | 12px | header DM、profile mini |
| `md` | 32 | 12px | icon 欄 user avatar / 訊息頭像 |
| `lg` | 36 | 13px | 標準訊息頭像（[3-2]） |
| `xl` | 48 | 17px | profile card / member list |

## Fallback 顯示

無頭像圖片時顯示縮寫：
- user：取名稱首字（英文）或首字符（中文）
- channel：顯示 `#`
- 背景依 user id hash 選 `avatar-fallback` palette 一色
- 文字：白色（背景夠深）或 `color.accent.teal-on` (#042f2e)（背景為 teal-300）

## Props

```ts
interface AvatarProps {
  type: 'user' | 'channel';
  name: string;
  imageUrl?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fallbackColor?: string;    // 不傳則由 hash 決定
  status?: 'online' | 'idle' | 'offline';   // 僅 type=user 顯示
}
```

## Tailwind 對照

```html
<!-- user (md) -->
<div class="flex h-8 w-8 items-center justify-center rounded-full bg-teal-300
            text-[12px] font-semibold text-teal-950">A</div>

<!-- channel (sm) -->
<div class="flex h-7 w-7 items-center justify-center rounded-md bg-blue-500
            text-[12px] font-semibold text-white">#</div>
```

## 修改提示

- 所有新增的頭像顯示位置都必須透過此元件；不要在其他地方自己刻 div + bg。
- fallback palette 在 tokens.json → `color.avatar-fallback`。新增顏色請加到那裡。
- **不要加光暈、陰影、漸層底色**（Linear 風格 = 平色）。
