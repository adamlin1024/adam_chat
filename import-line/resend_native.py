"""Re-send native 2026 messages (backup_native_2.json) via bot-api,
preserving original created_at as properties.original_created_at.

Content handling:
  - text/plain normal: send as text
  - vocechat/file: check file exists, resend as file ref. if 404 -> text fallback
  - reply: send as plain text (lose reply target since old mids are gone)
  - reaction: skip
"""
import argparse
import base64
import json
import sys
import time
from pathlib import Path
from urllib.parse import quote

import requests

DEFAULT_BASE = "https://cat-talk.up.railway.app"
CACHE_PATH = Path(__file__).with_name(".import_cache.json")


def send_text(base, api_key, target_uid, content, orig_ts_ms):
    props = {"original_created_at": orig_ts_ms}
    x_props = base64.b64encode(json.dumps(props).encode()).decode("ascii")
    return requests.post(
        f"{base}/api/bot/send_to_user/{target_uid}",
        headers={"x-api-key": api_key, "content-type": "text/plain",
                 "X-Properties": x_props},
        data=content.encode("utf-8"),
        timeout=30,
    )


def send_file_ref(base, api_key, target_uid, path, orig_ts_ms):
    props = {"original_created_at": orig_ts_ms}
    x_props = base64.b64encode(json.dumps(props).encode()).decode("ascii")
    return requests.post(
        f"{base}/api/bot/send_to_user/{target_uid}",
        headers={"x-api-key": api_key, "content-type": "vocechat/file",
                 "X-Properties": x_props},
        data=json.dumps({"path": path}).encode("utf-8"),
        timeout=30,
    )


def file_exists(base, token, path):
    enc = quote(path, safe="")
    r = requests.get(f"{base}/api/resource/file?file_path={enc}",
                     headers={"X-API-Key": token}, timeout=15)
    return r.status_code == 200


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base-url", default=DEFAULT_BASE)
    ap.add_argument("--peer", type=int, default=2)
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--start", type=int, default=0)
    ap.add_argument("--delay-ms", type=int, default=100)
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    sys.stdout.reconfigure(encoding="utf-8")
    base = args.base_url.rstrip("/")
    cache = json.loads(CACHE_PATH.read_text(encoding="utf-8"))
    token = cache["token"]
    key_of = {1: cache["key_1"], 2: cache["key_2"]}

    backup_path = Path(__file__).with_name(f"backup_native_{args.peer}.json")
    msgs = json.loads(backup_path.read_text(encoding="utf-8"))
    # sort by mid ascending (chronological on native since no original_created_at)
    msgs.sort(key=lambda m: m["mid"])

    window = msgs[args.start: (args.start + args.limit if args.limit else None)]
    print(f"resending {len(window)} msgs (start={args.start})")

    # peer mapping: we need to know Adam's uid. hardcode assumption uid=1 = Adam.
    adam_uid = 1
    peer_of = {adam_uid: args.peer, args.peer: adam_uid}

    ok = fail = skip = 0
    for i, m in enumerate(window):
        from_uid = m["from_uid"]
        target_uid = peer_of.get(from_uid)
        api_key = key_of.get(from_uid)
        if not api_key or not target_uid:
            skip += 1
            continue
        detail = m.get("detail", {})
        mtype = detail.get("type")
        ctype = detail.get("content_type")
        orig_ts = m["created_at"]

        if args.dry_run:
            content_preview = detail.get("content", "")
            if isinstance(content_preview, str):
                content_preview = content_preview[:40]
            print(f"  [{i}] from={from_uid} type={mtype} ct={ctype} -> {content_preview}")
            continue

        try:
            if mtype == "reaction":
                skip += 1
                continue
            if mtype == "normal" and ctype == "text/plain":
                r = send_text(base, api_key, target_uid, detail["content"], orig_ts)
            elif mtype == "reply" and ctype == "text/plain":
                # embed reply-target context as prefix? drop target ref
                r = send_text(base, api_key, target_uid, detail["content"], orig_ts)
            elif mtype == "normal" and ctype == "vocechat/file":
                path = detail["content"]
                if file_exists(base, token, path):
                    r = send_file_ref(base, api_key, target_uid, path, orig_ts)
                else:
                    name = (detail.get("properties") or {}).get("name") or "file"
                    r = send_text(base, api_key, target_uid, f"[圖片已遺失: {name}]", orig_ts)
            else:
                skip += 1
                print(f"  [{i}] skip unknown type={mtype} ct={ctype}")
                continue

            if r.status_code >= 400:
                fail += 1
                print(f"  [{i}] HTTP {r.status_code}: {r.text[:150]}")
            else:
                ok += 1
                if i % 50 == 0 or i < 5:
                    c = detail.get("content", "")
                    if not isinstance(c, str):
                        c = str(c)
                    print(f"  [{i+1}/{len(window)}] ok from={from_uid} -> {c[:40]}")
        except Exception as e:
            fail += 1
            print(f"  [{i}] EXC {e}")
        if args.delay_ms:
            time.sleep(args.delay_ms / 1000.0)

    print(f"done. ok={ok} fail={fail} skip={skip}")


if __name__ == "__main__":
    main()
