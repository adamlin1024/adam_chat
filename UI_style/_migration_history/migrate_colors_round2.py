"""
第二輪遷移：清掉殘留的舊寫法（dark: 前綴 / primary-*  palette / 半透明柔色狀態 bg）。
"""
from __future__ import annotations
import re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / "vocechat-web" / "src"

PROPS = ["text", "bg", "border", "fill", "stroke", "ring", "divide", "outline"]

# ── primary-* palette → accent ──
PRIMARY_TEXT = {"25": "fg-primary", "50": "fg-primary", "100": "fg-primary",
                "200": "accent", "300": "accent", "400": "accent",
                "500": "accent", "600": "accent-hover", "700": "accent-pressed",
                "800": "accent-pressed", "900": "accent-pressed"}
PRIMARY_BG = {"25": "bg-elevated", "50": "bg-surface", "100": "accent-bg",
              "200": "accent", "300": "accent", "400": "accent",
              "500": "accent", "600": "accent-hover", "700": "accent-pressed",
              "800": "accent-pressed", "900": "accent-pressed"}
PRIMARY_BORDER = {"25": "border-subtle", "50": "border-subtle", "100": "border-subtle",
                  "200": "accent", "300": "accent", "400": "accent",
                  "500": "accent", "600": "accent-hover", "700": "accent-pressed",
                  "800": "accent-pressed", "900": "accent-pressed"}

def apply_primary(content: str) -> tuple[str, int]:
    pat = re.compile(rf"\b(?P<dark>dark:)?(?P<prop>{'|'.join(PROPS)})-primary-(?P<shade>\d{{2,3}})\b")
    cnt = 0
    def repl(m):
        nonlocal cnt
        prop, shade, dark = m.group("prop"), m.group("shade"), m.group("dark") or ""
        eff = "text" if prop in ("fill", "stroke") else prop
        mp = {"text": PRIMARY_TEXT, "bg": PRIMARY_BG, "border": PRIMARY_BORDER,
              "fill": PRIMARY_TEXT, "stroke": PRIMARY_TEXT,
              "ring": PRIMARY_BORDER, "divide": PRIMARY_BORDER, "outline": PRIMARY_BORDER}.get(eff)
        if not mp: return m.group(0)
        tok = mp.get(shade)
        if not tok: return m.group(0)
        cnt += 1
        return f"{dark}{prop}-{tok}"
    return pat.sub(repl, content), cnt

# ── 移除冗餘 dark: 前綴 ──
# 一旦 base class 已使用 token（會自動切換），dark: 前綴等同於覆蓋 base，反而導致淺色看到 base 的舊色。
# 規則：把 `<base> dark:<override>` 中的 dark:override 拿掉，保留 base —— 但若 base 不對（如 text-fg-disabled）需替成 token。
# 安全做法：找出 `text-fg-disabled dark:text-white` 這種「base 是 disabled/subtle/muted、dark 是 white」的明顯標題誤用 → 改成 `text-fg-primary`
TITLE_PATTERNS = [
    (re.compile(r"text-fg-disabled\s+dark:text-white"), "text-fg-primary"),
    (re.compile(r"text-fg-subtle\s+dark:text-white"), "text-fg-primary"),
    (re.compile(r"text-fg-muted\s+dark:text-white"), "text-fg-primary"),
    (re.compile(r"text-fg-secondary\s+dark:text-white"), "text-fg-primary"),
    # 反向亦同
    (re.compile(r"dark:text-white\s+text-fg-disabled"), "text-fg-primary"),
    (re.compile(r"dark:text-white\s+text-fg-subtle"), "text-fg-primary"),
    (re.compile(r"dark:text-white\s+text-fg-muted"), "text-fg-primary"),
    (re.compile(r"dark:text-white\s+text-fg-secondary"), "text-fg-primary"),
]

# 單獨出現的 dark:text-white（沒有 base 配對）→ text-fg-primary
LONE_DARK = [
    (re.compile(r"\bdark:text-white\b"), "text-fg-primary"),
    # base bg-surface dark:bg-surface 是冗餘，留 base 即可
    (re.compile(r"\b(bg-bg-surface)\s+dark:bg-bg-surface\b"), r"\1"),
    (re.compile(r"\bdark:bg-bg-surface\s+(bg-bg-surface)\b"), r"\1"),
    (re.compile(r"\b(bg-bg-app)\s+dark:bg-bg-app\b"), r"\1"),
    (re.compile(r"\bdark:bg-bg-app\s+(bg-bg-app)\b"), r"\1"),
    (re.compile(r"\b(bg-bg-elevated)\s+dark:bg-bg-elevated\b"), r"\1"),
    (re.compile(r"\bdark:bg-bg-elevated\s+(bg-bg-elevated)\b"), r"\1"),
    (re.compile(r"\bdark:(bg-yellow-900/20|bg-yellow-800)\b"), ""),  # banner 專用，移除冗餘
    (re.compile(r"\bdark:(border-yellow-800)\b"), ""),
    (re.compile(r"\bdark:text-idle\b"), ""),
]

def apply_dark_cleanup(content: str) -> tuple[str, int]:
    cnt = 0
    for pat, sub in TITLE_PATTERNS + LONE_DARK:
        new, n = pat.subn(sub, content)
        if n:
            content = new
            cnt += n
    return content, cnt

# ── 殘留特殊色 ──
# yellow-50/100/200 → idle/10、yellow-700/800 → idle
# green-50/100/200 → online/10、green-700/800 → online
# red-100/200 → danger/10
SPECIAL = [
    # yellow banner
    (re.compile(r"\bbg-yellow-50\b"), "bg-idle/10"),
    (re.compile(r"\bbg-yellow-200\b"), "bg-idle/20"),
    (re.compile(r"\bborder-yellow-200\b"), "border-idle/30"),
    (re.compile(r"\btext-yellow-200\b"), "text-idle"),
    (re.compile(r"\btext-yellow-700\b"), "text-idle"),
    (re.compile(r"\btext-yellow-800\b"), "text-idle"),
    (re.compile(r"\bhover:bg-yellow-200\b"), "hover:bg-idle/20"),
    (re.compile(r"\bbg-yellow-700\b"), "bg-idle"),
    # green status bg
    (re.compile(r"\bbg-green-50\b"), "bg-online/10"),
    (re.compile(r"\bbg-green-100\b"), "bg-online/15"),
    (re.compile(r"\bbg-green-200/50\b"), "bg-online/20"),
    (re.compile(r"\bbg-green-700\b"), "bg-online"),
    (re.compile(r"\bbg-green-700/60\b"), "bg-online/60"),
    (re.compile(r"\btext-green-200\b"), "text-online"),
    (re.compile(r"\btext-green-800\b"), "text-online"),
    (re.compile(r"\bhover:bg-green-700\b"), "hover:bg-online"),
    # red status bg
    (re.compile(r"\bbg-red-100\b"), "bg-danger/15"),
    (re.compile(r"\bbg-red-200/50\b"), "bg-danger/20"),
    (re.compile(r"\bbg-red-200/60\b"), "bg-danger/20"),
    (re.compile(r"\btext-red-800\b"), "text-danger"),
    # orange (rarely)
    (re.compile(r"\bborder-orange-300\b"), "border-idle/30"),
    # primary-300/400 hover etc on dnd tip
    # white residuals — only those clearly broken in light mode
    (re.compile(r"\btext-white(/\d+)?\b(?=[^\"'`]*hover:bg-bg-elevated)"), r"text-fg-primary\1"),
]

def apply_specials(content: str) -> tuple[str, int]:
    cnt = 0
    for pat, sub in SPECIAL:
        new, n = pat.subn(sub, content)
        if n:
            content = new
            cnt += n
    return content, cnt

def process(p: Path, dry: bool) -> int:
    txt = p.read_text(encoding="utf-8")
    orig = txt
    total = 0
    for fn in (apply_primary, apply_dark_cleanup, apply_specials):
        txt, n = fn(txt)
        total += n
    if total and txt != orig and not dry:
        p.write_text(txt, encoding="utf-8")
    return total

def main():
    dry = "--dry" in sys.argv
    files = []
    for ext in ("*.tsx", "*.ts", "*.jsx", "*.js"):
        files.extend(ROOT.rglob(ext))
    grand = touched = 0
    for p in files:
        if "node_modules" in p.parts: continue
        n = process(p, dry)
        if n:
            print(f"  {n:>4}  {p.relative_to(ROOT)}")
            grand += n; touched += 1
    print(f"\n{'(dry-run) ' if dry else ''}{grand} substitutions across {touched} files")

if __name__ == "__main__":
    main()
