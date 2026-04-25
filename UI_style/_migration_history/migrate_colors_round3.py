"""
第三輪：精修剩餘 text-white / bg-black/* / 殘留 dark: prefix。
"""
from __future__ import annotations
import re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / "vocechat-web" / "src"

def fix(content: str) -> tuple[str, int]:
    """逐檔逐行判斷 text-white 應改 fg-primary 還是 accent-on。
    規則：同一個 className 內若同時有 bg-accent / bg-primary-* 則 → text-accent-on，
          若有 bg-danger / bg-online → 維持 text-white（紅綠底永遠白字）；
          其他情況 → text-fg-primary。
    """
    cnt = 0
    # 處理 className="..." 與 `...` 兩種形式
    cls_pat = re.compile(r'(?P<q>"|\'|`)([^"\'`]*?)(?P=q)')

    def fix_classlist(s: str) -> str:
        nonlocal cnt
        if "text-white" not in s and "bg-black" not in s:
            return s
        new = s
        # bg-black/40 等遮罩 → bg-bg-overlay
        new, n = re.subn(r"\bbg-black/(?:40|50|60|70|80|90)\b", "bg-bg-overlay", new); cnt += n
        new, n = re.subn(r"\bbg-black\b(?!/)", "bg-bg-overlay", new); cnt += n
        # 判斷 text-white 走哪
        on_accent = re.search(r"\b(bg-accent|bg-primary-\d{2,3})\b", new)
        on_status = re.search(r"\b(bg-danger|bg-danger-bg|bg-online|bg-idle)\b", new)
        if on_accent and not on_status:
            new, n = re.subn(r"\btext-white\b", "text-accent-on", new); cnt += n
            new, n = re.subn(r"\bhover:text-white\b", "hover:text-accent-on", new); cnt += n
        elif on_status:
            pass  # 紅綠黃底維持 text-white
        else:
            new, n = re.subn(r"\btext-white\b", "text-fg-primary", new); cnt += n
            new, n = re.subn(r"\bhover:text-white\b", "hover:text-fg-primary", new); cnt += n
        return new

    def repl(m: re.Match) -> str:
        return f"{m.group('q')}{fix_classlist(m.group(2))}{m.group('q')}"

    out = cls_pat.sub(repl, content)

    # 全域清理：殘留 dark: 顏色前綴對映到 yellow/green/orange palette（這些 token 已不存在）
    leftovers = [
        (r"\s+dark:hover:bg-yellow-\d{3}\b", ""),
        (r"\s+dark:bg-yellow-\d{3}(?:/\d+)?\b", ""),
        (r"\s+dark:bg-green-\d{3}(?:/\d+)?\b", ""),
        (r"\s+dark:bg-red-\d{3}(?:/\d+)?\b", ""),
        (r"\s+dark:border-yellow-\d{3}\b", ""),
        (r"\s+dark:text-yellow-\d{3}\b", ""),
        (r"\s+dark:text-idle\b", ""),
        # text-white/90 → text-fg-primary/90 in misc cases
        (r"\btext-white/(\d+)\b", r"text-fg-primary/\1"),
    ]
    for pat, sub in leftovers:
        out, n = re.subn(pat, sub, out)
        cnt += n

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
