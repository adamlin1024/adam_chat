# [5-2] 註冊頁 (Register)

透過邀請連結進入後的帳號建立頁面。需要有效 `magic_token`。

- **ID**：`5-2`
- **對應檔案**：`src/routes/reg/`
- **依賴 token**：同 [5-1] 登入頁

## 視覺規格

結構同 [5-1]，差異：

### 標題

- `建立帳號` — 同登入頁樣式

### Subtitle（驗證狀態）

取代原本的說明文字，顯示 token 驗證結果：

| 狀態 | 文字 | 顏色 |
|---|---|---|
| 驗證中 | `VALIDATING INVITE...` | `#71717a` |
| 有效 | `✓ 邀請連結有效` | `#4ade80` |
| 失效 | `✗ 邀請連結已過期` | `#f87171` |
| 無效 token | `✗ 邀請連結無效` | `#f87171` |

- `font-mono 10.5px`

### Input 欄位

- `你的名稱`（text）
- `設定密碼`（password，至少 8 字元）
- `確認密碼`（password）— 可選，看 app 邏輯

### 主按鈕

- `CREATE ACCOUNT` / `建立帳號`
- 樣式同登入頁
- disabled 狀態：token 無效或欄位不齊全時 → `bg: #18191d`, `color: #3f3f46`

### 無「或使用 Magic Link」連結

- 註冊頁不顯示此項。

## Props

```ts
interface RegisterPageProps {
  magicToken: string;
  tokenStatus: 'validating' | 'valid' | 'expired' | 'invalid';
  onRegister: (name: string, password: string) => Promise<void>;
}
```

## Tailwind 對照

```html
<div class="flex min-h-screen items-center justify-center bg-bg-app">
  <form class="flex w-[360px] flex-col items-center gap-3.5 rounded-[10px]
               border border-border bg-bg-elevated px-[26px] py-7">
    <div class="logo">A</div>
    <h1 class="text-[20px] font-bold text-fg-primary">建立帳號</h1>

    {status === 'valid' && (
      <p class="font-mono text-[12px] text-green-400">✓ 邀請連結有效</p>
    )}
    {status === 'expired' && (
      <p class="font-mono text-[12px] text-red-400">✗ 邀請連結已過期</p>
    )}

    <input placeholder="你的名稱" class="w-full rounded-md border border-border bg-bg-app
           px-3.5 py-[11px] text-[14.5px] text-fg-body placeholder:text-fg-subtle
           focus:border-border-strong outline-none" />
    <input type="password" placeholder="設定密碼" class="..." />

    <button disabled={status !== 'valid'}
      class="w-full rounded-md bg-accent-300 py-[11px]
             font-mono text-[13px] font-bold tracking-wider text-teal-950
             disabled:bg-bg-surface disabled:text-fg-disabled">
      CREATE ACCOUNT
    </button>
  </form>
</div>
```

## 修改提示

- 驗證狀態訊息請維持 mono + `✓` / `✗` 前綴；這是風格一致性關鍵。
- token 無效時 input 可顯示但 disabled；按鈕永遠 disabled。
