# [3-2] 單一訊息 (Message)

最核心的元件。一則訊息的完整呈現。

- **ID**：`3-2`
- **對應檔案**：`src/components/Message/index.tsx`
- **依賴 token**：`color.text.primary`, `color.text.body`, `color.text.muted`, `color.text.disabled`, `color.border.default`, `color.accent.teal-300`, `color.accent.teal-bg`, `color.accent.teal-border`
- **相關元件**：[2-3] Avatar, [4-3] 右鍵選單

## 視覺規格

### 外層

- `display: flex`，gap 12px
- padding：單邊不必加；訊息之間 gap 14px 由 parent 控制
- hover 整列：`background: #0d0e11`（可選，幫助閱讀游標）

### 頭像

- Avatar `md` (30–36px)，與名字水平對齊頂部

### Body

- **名字列**：flex baseline gap 7px
  - 名字：`Inter 600 / 12.5px`，`color: #f4f4f5`
  - 時間：`font-mono 10px`，`color: #3f3f46`
- **訊息正文**：`Inter 400 / 13px / line-height 1.5`，`color: #d4d4d8`
- **markdown / code**：code inline 用 `bg: #18191d`, `border: 1px solid #27272a`, `rounded-sm`, `font-mono 11.5px`

### Reaction

- display inline-flex gap 4px，margin-top 6px
- 每個 reaction chip：
  - `border: 1px solid #27272a`，transparent bg
  - padding `2px 8px`，`rounded-sm`
  - `font-size: 10.5px`，emoji + 空白 + 數字
  - color: `#a1a1aa`
- **自己按過的**（mine）：
  - `border-color: #5eead430`
  - `bg: #5eead415`
  - `color: #5eead4`

### Reply Quote（回覆引用）

訊息本文上方顯示被引用的訊息：

- `border-left: 2px solid #5eead4`
- padding `2px 10px`，margin `4px 0 6px`
- `background: linear-gradient(90deg, #5eead410, transparent)`
- `border-radius: 0 4px 4px 0`
- quote name：`font-mono / 10px / 600 / #5eead4`
- quote text：`Inter 400 / 10.5px / #71717a`，truncate

### 編輯標記

- 編輯過的訊息：文末加 `(edited)`，`font-mono 10px / #3f3f46`

## 狀態

| State | 變化 |
|---|---|
| default | 平列 |
| hover | `bg: #0d0e11`；右上浮出操作按鈕（reaction、reply、more）|
| own message | 無特別底色（Linear 不做聊天泡泡） |
| pinned | 左側加 2px teal 實線（與 reply quote 相反邊） |
| deleted | 正文換成 `[訊息已刪除]`，`color: #52525b`，italic |

## 右上操作按鈕（hover 時浮出）

- reaction / reply / forward / more
- 每顆 24×24，`border: 1px solid #27272a`，`bg: #08090b`

## Props

```ts
interface MessageProps {
  id: string;
  author: { name: string; avatarProps: AvatarProps };
  timestamp: string;          // 顯示用字串："10:32"
  content: string;            // markdown
  reactions?: Array<{ emoji: string; count: number; mine: boolean }>;
  replyTo?: { authorName: string; preview: string };
  isEdited?: boolean;
  isPinned?: boolean;
  isDeleted?: boolean;
  onReact: (emoji: string) => void;
  onReply: () => void;
  onContextMenu: (e) => void; // 右鍵選單 [4-3]
}
```

## Tailwind 對照

```html
<article class="group flex gap-3 hover:bg-[#0d0e11] -mx-5 px-5 py-1">
  <Avatar type="user" name="Adam" size="md" />
  <div class="min-w-0 flex-1">
    <!-- name row -->
    <div class="mb-0.5 flex items-baseline gap-2">
      <span class="text-[12.5px] font-semibold tracking-tight text-fg-primary">Adam</span>
      <span class="font-mono text-[10px] text-fg-disabled">10:32</span>
    </div>

    <!-- reply quote (optional) -->
    <blockquote class="mb-1.5 rounded-r-sm border-l-2 border-accent-300
                       bg-gradient-to-r from-accent-300/10 to-transparent px-2.5 py-0.5">
      <div class="font-mono text-[10px] font-semibold text-accent-300">TestUser</div>
      <div class="truncate text-[10.5px] text-fg-muted">收到了！</div>
    </blockquote>

    <!-- body -->
    <div class="text-[13px] leading-[1.5] text-fg-body">大家好，這是我們的聊天室 👋</div>

    <!-- reactions -->
    <div class="mt-1.5 flex gap-1">
      <button data-mine="true"
        class="rounded-sm border border-border px-2 py-0.5 text-[10.5px] text-fg-secondary
               data-[mine=true]:border-accent-300/30 data-[mine=true]:bg-accent-300/10
               data-[mine=true]:text-accent-300">
        👍 2
      </button>
      <button class="rounded-sm border border-border px-2 py-0.5 text-[10.5px] text-fg-secondary">
        🎉 1
      </button>
    </div>
  </div>
</article>
```

## 修改提示

- 這是視覺改動影響最大的元件。改 reaction / quote 樣式前先確認整體仍維持「Linear 的克制感」。
- **不要**加訊息泡泡（background rounded container）— 會破壞風格。
- **不要**加頭像邊框光暈。
