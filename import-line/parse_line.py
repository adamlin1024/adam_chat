"""Parse LINE chat export into a list of messages.

Format per line:
    2025/10/07（二）           <- date header
    HH:MM<TAB>Sender<TAB>Content
    HH:MM<TAB><TAB>SystemText   <- system event (empty sender -> skip)
    (continuation lines without HH:MM tab prefix -> append to previous)

Output: list of dicts {ts_ms, sender, content}, sorted by ts_ms.
Timestamps are interpreted in Asia/Taipei timezone.
"""
import re
import sys
from datetime import datetime
from zoneinfo import ZoneInfo

DATE_RE = re.compile(r"^(\d{4})/(\d{2})/(\d{2})（[一二三四五六日]）$")
TIME_RE = re.compile(r"^(\d{2}):(\d{2})\t([^\t]*)\t(.*)$")
TW = ZoneInfo("Asia/Taipei")


def parse(path: str):
    with open(path, encoding="utf-8") as f:
        lines = f.read().split("\n")

    messages = []
    cur_date = None  # (y, m, d)
    cur_msg = None

    def flush():
        nonlocal cur_msg
        if cur_msg is not None:
            messages.append(cur_msg)
            cur_msg = None

    for ln in lines[3:]:  # skip 3-line header
        if not ln:
            flush()
            continue

        m = DATE_RE.match(ln)
        if m:
            flush()
            cur_date = (int(m.group(1)), int(m.group(2)), int(m.group(3)))
            continue

        tm = TIME_RE.match(ln)
        if tm:
            flush()
            if cur_date is None:
                continue
            hour = int(tm.group(1))
            minute = int(tm.group(2))
            sender = tm.group(3)
            content = tm.group(4)
            if not sender:
                continue  # system event
            y, mo, d = cur_date
            dt = datetime(y, mo, d, hour, minute, tzinfo=TW)
            cur_msg = {
                "ts_ms": int(dt.timestamp() * 1000),
                "sender": sender,
                "content": content,
            }
            continue

        if cur_msg is not None:
            cur_msg["content"] += "\n" + ln
        # lines without active message and without time/date prefix are dropped

    flush()
    messages.sort(key=lambda x: x["ts_ms"])
    return messages


if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 else r"C:\Users\User\Desktop\Adam_lab\Adam_chat\[LINE] 遊戲與生活交流群的聊天.txt"
    msgs = parse(path)
    sys.stdout.reconfigure(encoding="utf-8")
    senders = {}
    for m in msgs:
        senders[m["sender"]] = senders.get(m["sender"], 0) + 1
    print("total:", len(msgs))
    print("senders:", senders)
    print("first:", msgs[0])
    print("last :", msgs[-1])
    print("multi-line:", sum(1 for m in msgs if "\n" in m["content"]))
    print("samples:")
    for m in msgs[:5] + msgs[-3:]:
        ts = datetime.fromtimestamp(m["ts_ms"] / 1000, TW).strftime("%Y-%m-%d %H:%M")
        print(f"  [{ts}] {m['sender']}: {m['content'][:60]}")
