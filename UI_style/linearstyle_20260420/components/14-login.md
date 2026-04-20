# [5-1] 登入頁 (Login)

完整登入頁面。支援帳號密碼與 Magic Link。

- **ID**：`5-1`
- **對應檔案**：`src/routes/login/`
- **依賴 token**：`color.bg.app`, `color.bg.elevated`, `color.border.default`, `color.accent.teal-300`, `color.text.*`

## 視覺規格

### 頁面

- `background: #08090b`
- 居中 flex，min-height 100vh
- 無裝飾背景（無漸層、無大標題）

### 卡片

- 寬度：320px
- padding：`28px 26px`
- `background: #0c0d10`
- `border: 1px solid #27272a`
- `border-radius: 10px`
- display flex column / gap 14px / items-center

### Logo

- 40×40px，`rounded-md` (6px)
- `background: #5eead4`, `color: #042f2e`
- `Inter 800 / 17px` 單字母
- 或用 app 的 logo SVG

### 標題

- `登入 Adam_chat` — `Inter 700 / 16px`，`color: #f4f4f5`，`letter-spacing: -0.015em`

### Subtitle

- `font-mono 10.5px`，`color: #71717a`
- 例：`輸入帳號密碼繼續`

### Input 欄位

- width 100%
- `background: #08090b`
- `border: 1px solid #27272a`，`rounded-md`
- padding `9px 12px`
- `font-size: 12.5px`, `color: #d4d4d8`
- placeholder：`color: #52525b`
- focus：`border-color: #3f3f46`
- 欄位間 gap 10px

### 主按鈕

- width 100%
- padding 10px
- `bg: #5eead4`, `color: #042f2e`
- `rounded-md`, `font-mono 11.5px / 700 / 0.1em caps`
- 文字：`SIGN IN` 或 `登入`（看應用語言）

### Secondary action

- mono 文字連結：`或使用 Magic Link 登入`
- `font-mono 10.5px`, `color: #71717a`
- hover `color: #a1a1aa`

## 錯誤狀態

- input border 變 `#f87171`
- 錯誤文字：`font-mono 10.5px`, `color: #f87171`，置於 input 下方 gap 4px

## Props

```ts
interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onMagicLink: () => void;
  errorMessage?: string;
}
```

## Tailwind 對照

```html
<div class="flex min-h-screen items-center justify-center bg-bg-app">
  <form class="flex w-[320px] flex-col items-center gap-3.5 rounded-[10px]
               border border-border bg-bg-elevated px-[26px] py-7">
    <div class="flex h-10 w-10 items-center justify-center rounded-md
                bg-accent-300 text-[17px] font-extrabold text-teal-950">A</div>
    <h1 class="text-[16px] font-bold tracking-tight text-fg-primary">登入 Adam_chat</h1>
    <p class="font-mono text-[10.5px] text-fg-muted">輸入帳號密碼繼續</p>

    <input class="w-full rounded-md border border-border bg-bg-app px-3 py-2.5
                  text-[12.5px] text-fg-body placeholder:text-fg-subtle
                  focus:border-border-strong outline-none"
           placeholder="Email" />
    <input class="... " type="password" placeholder="密碼" />

    <button class="w-full rounded-md bg-accent-300 py-2.5
                   font-mono text-[11.5px] font-bold tracking-wider text-teal-950">
      SIGN IN
    </button>
    <button class="font-mono text-[10.5px] text-fg-muted hover:text-fg-secondary">
      或使用 Magic Link 登入
    </button>
  </form>
</div>
```

## 修改提示

- **不做**大型 hero / 左右分欄 / 品牌宣傳（Linear 登入頁刻意極簡）。
- 「SIGN IN」用 mono + caps 是風格特徵，與送訊息按鈕呼應。
