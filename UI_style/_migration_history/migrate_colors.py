"""
一次性遷移腳本：把 Tailwind 預設調色盤與寫死 hex 全部改為設計系統 token。
執行：python migrate_colors.py [--dry]
"""

from __future__ import annotations
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / "vocechat-web" / "src"

# ─── 一階規則（精確字串對換）──────────────
# Greyscale (zinc / gray / slate / stone / neutral)
GREY = ["zinc", "gray", "slate", "stone", "neutral"]
GREY_MAP_TEXT = {
    "50":  "fg-primary", "100": "fg-primary",
    "200": "fg-body",    "300": "fg-body",
    "400": "fg-secondary",
    "500": "fg-muted",
    "600": "fg-subtle",
    "700": "fg-disabled", "800": "fg-disabled",
    "900": "fg-disabled", "950": "fg-disabled",
}
GREY_MAP_BG = {
    "50":  "bg-elevated", "100": "bg-elevated",
    "200": "bg-surface",  "300": "bg-surface",
    "400": "bg-hover",
    "500": "bg-hover",
    "600": "bg-surface",
    "700": "bg-surface",
    "800": "bg-elevated", "900": "bg-app", "950": "bg-app",
}
GREY_MAP_BORDER = {
    "50":  "border-subtle", "100": "border-subtle",
    "200": "border-subtle", "300": "border",
    "400": "border", "500": "border-strong",
    "600": "border-strong",
    "700": "border", "800": "border-subtle",
    "900": "border-subtle", "950": "border-subtle",
}
# Teal → accent
TEAL_MAP_TEXT = {
    "300": "accent", "400": "accent", "500": "accent-hover",
    "600": "accent-pressed", "700": "accent-pressed",
}
TEAL_MAP_BG = {
    "300": "accent", "400": "accent-hover", "500": "accent-pressed",
    "600": "accent-pressed", "700": "accent-pressed",
}
TEAL_MAP_BORDER = TEAL_MAP_TEXT

# Red → danger
RED_MAP_TEXT = {s: "danger" for s in ["300", "400", "500", "600", "700"]}
RED_MAP_BG = {s: "danger-bg" for s in ["400", "500", "600", "700"]}
RED_MAP_BORDER = {s: "danger" for s in ["400", "500", "600", "700"]}

# Green → online
GREEN_MAP_TEXT = {s: "online" for s in ["400", "500", "600"]}
GREEN_MAP_BG = {s: "online" for s in ["400", "500", "600"]}
GREEN_MAP_BORDER = {s: "online" for s in ["400", "500", "600"]}

# Yellow / amber → idle (warning)
YEL_MAP_TEXT = {s: "idle" for s in ["300", "400", "500", "600"]}
YEL_MAP_BG = {s: "idle" for s in ["300", "400", "500", "600"]}
YEL_MAP_BORDER = {s: "idle" for s in ["300", "400", "500", "600"]}

# Blue / cyan / sky → 視為 accent（原本深色設計用 cyan/teal 系做 accent）
BLUE = ["blue", "cyan", "sky", "indigo"]
BLUE_MAP_TEXT = {
    "300": "accent", "400": "accent", "500": "accent",
    "600": "accent-hover", "700": "accent-pressed",
}
BLUE_MAP_BG = BLUE_MAP_TEXT
BLUE_MAP_BORDER = BLUE_MAP_TEXT

# 寫死 hex（從深色設計系統反推 token）
HEX_MAP = {
    # 深色 hex
    "#08090b": "bg-app",
    "#0c0d10": "bg-elevated",
    "#0a0b0e": "bg-canvas",
    "#141519": "bg-surface",
    "#0f1014": "bg-hover",
    "#0d0e11": "bg-hover",
    "#18191d": "border-subtle",
    "#27272a": "border",
    "#3f3f46": "border-strong",
    "#f4f4f5": "fg-primary",
    "#e4e4e7": "fg-body",
    "#d4d4d8": "fg-body",
    "#a1a1aa": "fg-secondary",
    "#71717a": "fg-muted",
    "#52525b": "fg-subtle",
    "#5eead4": "accent",
    "#2dd4bf": "accent-hover",
    "#14b8a6": "accent-pressed",
    "#042f2e": "accent-on",
    "#4ade80": "online",
    "#fbbf24": "idle",
    "#f87171": "danger",
    "#ef4444": "danger-bg",
}

PROPS = ["text", "bg", "border", "fill", "stroke", "ring", "divide", "outline"]

def build_palette_pattern(palette_names: list[str]) -> re.Pattern:
    return re.compile(
        rf"\b(?P<dark>dark:)?(?P<prop>{'|'.join(PROPS)})-(?P<color>{'|'.join(palette_names)})-(?P<shade>\d{{2,3}})\b"
    )

def apply_palette(content: str, palette_names: list[str], maps: dict[str, dict[str, str]]) -> tuple[str, int]:
    """maps: {prop: {shade: token}}"""
    pat = build_palette_pattern(palette_names)
    count = 0

    def repl(m: re.Match) -> str:
        nonlocal count
        prop = m.group("prop")
        shade = m.group("shade")
        dark = m.group("dark") or ""
        # Map fill→text-equivalent, stroke→text-equivalent for greyscale fg
        eff_prop = "text" if prop in ("fill", "stroke") else prop
        m2 = maps.get(eff_prop)
        if not m2:
            return m.group(0)
        token = m2.get(shade)
        if not token:
            return m.group(0)
        # Reconstruct: e.g. text-fg-primary, bg-bg-surface, border-border, fill-fg-primary
        # token already includes prefix like "fg-primary", "bg-surface", "border", "accent"
        # Output prop is original prop (text/bg/border/fill/stroke/...)
        if token.startswith(("fg-", "bg-", "accent", "danger", "online", "idle", "border")):
            out = f"{dark}{prop}-{token}"
        else:
            out = f"{dark}{prop}-{token}"
        count += 1
        return out

    return pat.sub(repl, content), count

def apply_white_black(content: str) -> tuple[str, int]:
    """text-white / bg-white / border-white / black 等。
    text-white：保留（多半是在 accent/danger 上的字）
    bg-white：→ bg-elevated
    border-white：→ border-strong
    text-black：→ text-fg-primary
    bg-black：→ bg-app
    border-black：→ border-strong
    """
    rules = [
        (re.compile(r"\b(dark:)?bg-white\b"),     r"\1bg-bg-elevated"),
        (re.compile(r"\b(dark:)?border-white\b"), r"\1border-border-strong"),
        (re.compile(r"\b(dark:)?text-black\b"),   r"\1text-fg-primary"),
        (re.compile(r"\b(dark:)?bg-black\b"),     r"\1bg-bg-app"),
        (re.compile(r"\b(dark:)?border-black\b"), r"\1border-border-strong"),
        (re.compile(r"\b(dark:)?fill-white\b"),   r"\1fill-fg-primary"),
        (re.compile(r"\b(dark:)?stroke-white\b"), r"\1stroke-fg-primary"),
        (re.compile(r"\b(dark:)?fill-black\b"),   r"\1fill-fg-primary"),
        (re.compile(r"\b(dark:)?stroke-black\b"), r"\1stroke-fg-primary"),
    ]
    count = 0
    for pat, sub in rules:
        new, n = pat.subn(sub, content)
        if n:
            content = new
            count += n
    return content, count

def apply_hex_arbitrary(content: str) -> tuple[str, int]:
    """處理 bg-[#hex] / text-[#hex] / border-[#hex] / fill-[#hex] / stroke-[#hex]"""
    pat = re.compile(rf"\b(?P<dark>dark:)?(?P<prop>{'|'.join(PROPS)})-\[(?P<hex>#[0-9a-fA-F]{{3,8}})\]")
    count = 0

    def repl(m: re.Match) -> str:
        nonlocal count
        prop = m.group("prop")
        hex_val = m.group("hex").lower()
        dark = m.group("dark") or ""
        token = HEX_MAP.get(hex_val)
        if not token:
            return m.group(0)
        count += 1
        return f"{dark}{prop}-{token}"

    return pat.sub(repl, content), count

def process_file(p: Path, dry: bool) -> int:
    txt = p.read_text(encoding="utf-8")
    original = txt
    total = 0

    # 1. greyscale
    txt, n = apply_palette(txt, GREY, {"text": GREY_MAP_TEXT, "bg": GREY_MAP_BG, "border": GREY_MAP_BORDER, "fill": GREY_MAP_TEXT, "stroke": GREY_MAP_TEXT, "ring": GREY_MAP_BORDER, "divide": GREY_MAP_BORDER, "outline": GREY_MAP_BORDER})
    total += n
    # 2. teal
    txt, n = apply_palette(txt, ["teal", "emerald"], {"text": TEAL_MAP_TEXT, "bg": TEAL_MAP_BG, "border": TEAL_MAP_BORDER, "fill": TEAL_MAP_TEXT, "stroke": TEAL_MAP_TEXT, "ring": TEAL_MAP_BORDER, "divide": TEAL_MAP_BORDER, "outline": TEAL_MAP_BORDER})
    total += n
    # 3. red / rose / orange (orange 較少，當 danger 用)
    txt, n = apply_palette(txt, ["red", "rose", "orange"], {"text": RED_MAP_TEXT, "bg": RED_MAP_BG, "border": RED_MAP_BORDER, "fill": RED_MAP_TEXT, "stroke": RED_MAP_TEXT, "ring": RED_MAP_BORDER, "divide": RED_MAP_BORDER, "outline": RED_MAP_BORDER})
    total += n
    # 4. green / lime
    txt, n = apply_palette(txt, ["green", "lime"], {"text": GREEN_MAP_TEXT, "bg": GREEN_MAP_BG, "border": GREEN_MAP_BORDER, "fill": GREEN_MAP_TEXT, "stroke": GREEN_MAP_TEXT, "ring": GREEN_MAP_BORDER, "divide": GREEN_MAP_BORDER, "outline": GREEN_MAP_BORDER})
    total += n
    # 5. yellow / amber
    txt, n = apply_palette(txt, ["yellow", "amber"], {"text": YEL_MAP_TEXT, "bg": YEL_MAP_BG, "border": YEL_MAP_BORDER, "fill": YEL_MAP_TEXT, "stroke": YEL_MAP_TEXT, "ring": YEL_MAP_BORDER, "divide": YEL_MAP_BORDER, "outline": YEL_MAP_BORDER})
    total += n
    # 6. blue family
    txt, n = apply_palette(txt, BLUE, {"text": BLUE_MAP_TEXT, "bg": BLUE_MAP_BG, "border": BLUE_MAP_BORDER, "fill": BLUE_MAP_TEXT, "stroke": BLUE_MAP_TEXT, "ring": BLUE_MAP_BORDER, "divide": BLUE_MAP_BORDER, "outline": BLUE_MAP_BORDER})
    total += n
    # 7. white/black
    txt, n = apply_white_black(txt)
    total += n
    # 8. arbitrary hex
    txt, n = apply_hex_arbitrary(txt)
    total += n

    if total > 0 and txt != original and not dry:
        p.write_text(txt, encoding="utf-8")
    return total

def main():
    dry = "--dry" in sys.argv
    files = []
    for ext in ("*.tsx", "*.ts", "*.jsx", "*.js"):
        files.extend(ROOT.rglob(ext))
    grand = 0
    touched = 0
    for p in files:
        if "node_modules" in p.parts:
            continue
        n = process_file(p, dry)
        if n:
            print(f"  {n:>4}  {p.relative_to(ROOT)}")
            grand += n
            touched += 1
    print(f"\n{'(dry-run) ' if dry else ''}{grand} substitutions across {touched} files")

if __name__ == "__main__":
    main()
