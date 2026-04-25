"""
第四輪：消滅 `dark:` 前綴。token 已自動切換，前綴只會讓淺色看到 base（多為錯色）。
規則：
  - `text-X dark:text-Y` → `text-Y`（採 dark 為兩主題基準）
  - `bg-X dark:bg-Y` → `bg-Y`
  - `border-X dark:border-Y` → `border-Y`
  - `hover:X dark:hover:Y` → `hover:Y`
  - 單獨的 `dark:foo-bar`（沒有 base 配對）→ `foo-bar`
"""
from __future__ import annotations
import re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent / "vocechat-web" / "src"

# Tailwind utility prefixes we care about
PROPS = "text|bg|border|fill|stroke|ring|divide|outline|shadow|from|to|via|placeholder|caret"

def fix(content: str) -> tuple[str, int]:
    cnt = 0
    cls_pat = re.compile(r'(?P<q>"|\'|`)([^"\'`]*?)(?P=q)')

    def fix_cls(s: str) -> str:
        nonlocal cnt
        if "dark:" not in s:
            return s
        # 先處理 hover:/focus:/group-hover: 等 variant + dark: 配對
        # `hover:bg-X dark:hover:bg-Y` → `hover:bg-Y`
        # `dark:hover:bg-Y hover:bg-X` → `hover:bg-Y`
        for variant in ("hover", "focus", "active", "focus-visible", "focus-within", "group-hover", "md:hover", "md:dark:hover", "disabled"):
            base_first = re.compile(rf"\b{variant}:({PROPS})-([\w/-]+)\s+dark:{variant}:(?:[\w/-]+:)?({PROPS})-([\w/-]+)\b")
            new, n = base_first.subn(rf"{variant}:\3-\4", s)
            if n: s = new; cnt += n
            dark_first = re.compile(rf"\bdark:{variant}:({PROPS})-([\w/-]+)\s+{variant}:(?:[\w/-]+:)?({PROPS})-([\w/-]+)\b")
            new, n = dark_first.subn(rf"{variant}:\1-\2", s)
            if n: s = new; cnt += n
        # 一般 base + dark 配對：`text-X dark:text-Y` → `text-Y`
        # 用順序：base 在前
        gen_base_first = re.compile(rf"\b({PROPS})-([\w/-]+)\s+dark:({PROPS})-([\w/-]+)\b")
        new, n = gen_base_first.subn(r"\3-\4", s)
        if n: s = new; cnt += n
        gen_dark_first = re.compile(rf"\bdark:({PROPS})-([\w/-]+)\s+({PROPS})-([\w/-]+)\b")
        new, n = gen_dark_first.subn(r"\1-\2", s)
        if n: s = new; cnt += n
        # 殘留單獨 dark: 前綴（沒 base 配對）→ 直接拆掉前綴
        lone = re.compile(rf"\bdark:(?:(hover|focus|active|focus-visible|focus-within|group-hover|md:hover|disabled):)?({PROPS})-([\w/-]+)\b")
        def lone_repl(m):
            nonlocal cnt
            cnt += 1
            v = m.group(1)
            return f"{v}:{m.group(2)}-{m.group(3)}" if v else f"{m.group(2)}-{m.group(3)}"
        s = lone.sub(lone_repl, s)
        return s

    out = cls_pat.sub(lambda m: f"{m.group('q')}{fix_cls(m.group(2))}{m.group('q')}", content)
    return out, cnt

def process(p: Path, dry: bool) -> int:
    txt = p.read_text(encoding="utf-8")
    orig = txt
    txt, n = fix(txt)
    if n and txt != orig and not dry:
        p.write_text(txt, encoding="utf-8")
    return n

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
