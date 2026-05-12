"""Delete ALL messages in a DM based on backup_dm_{peer}.json.

DESTRUCTIVE. Use --confirm to actually delete.
"""
import argparse
import json
import sys
import time
from pathlib import Path

import requests

DEFAULT_BASE = "https://cat-talk.up.railway.app"
CACHE_PATH = Path(__file__).with_name(".import_cache.json")


def login_from_env(base):
    env_path = Path(__file__).with_name(".env")
    email = password = None
    for ln in env_path.read_text(encoding="utf-8").splitlines():
        ln = ln.strip()
        if not ln or ln.startswith("#") or "=" not in ln:
            continue
        k, v = ln.split("=", 1)
        k = k.strip()
        v = v.strip().strip('"').strip("'")
        if k == "VOCECHAT_EMAIL":
            email = v
        elif k == "VOCECHAT_PASSWORD":
            password = v
    r = requests.post(
        f"{base}/api/token/login",
        json={"credential": {"type": "password", "email": email, "password": password},
              "device": "line-import-script"},
        timeout=30,
    )
    r.raise_for_status()
    return r.json()["token"]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base-url", default=DEFAULT_BASE)
    ap.add_argument("--peer", type=int, default=2)
    ap.add_argument("--confirm", action="store_true", help="actually delete")
    ap.add_argument("--delay-ms", type=int, default=50)
    args = ap.parse_args()

    sys.stdout.reconfigure(encoding="utf-8")
    base = args.base_url.rstrip("/")
    cache = json.loads(CACHE_PATH.read_text(encoding="utf-8"))
    # always re-login at start (token expires in ~2h)
    print("logging in for fresh token ...", flush=True)
    token = login_from_env(base)
    cache["token"] = token
    CACHE_PATH.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")

    backup_path = Path(__file__).with_name(f"backup_dm_{args.peer}.json")
    msgs = json.loads(backup_path.read_text(encoding="utf-8"))
    mids = [m["mid"] for m in msgs]
    print(f"loaded {len(mids)} mids to delete (from {backup_path.name})")
    print(f"range: mid {min(mids)} .. {max(mids)}")

    if not args.confirm:
        print("\nDRY RUN. pass --confirm to actually delete.")
        return

    ok = fail = 0
    for i, mid in enumerate(mids):
        r = requests.delete(f"{base}/api/message/{mid}",
                            headers={"X-API-Key": token}, timeout=30)
        if r.status_code == 401:
            # token expired mid-run; refresh and retry
            print("  token expired, re-logging in ...", flush=True)
            token = login_from_env(base)
            cache["token"] = token
            CACHE_PATH.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")
            r = requests.delete(f"{base}/api/message/{mid}",
                                headers={"X-API-Key": token}, timeout=30)
        if r.status_code == 200:
            ok += 1
        elif r.status_code == 404:
            # already deleted, count as success
            ok += 1
        else:
            fail += 1
            print(f"  [{i}] mid={mid} HTTP {r.status_code}: {r.text[:100]}", flush=True)
        if i % 50 == 0:
            print(f"  progress {i+1}/{len(mids)} ok={ok} fail={fail}", flush=True)
        if args.delay_ms:
            time.sleep(args.delay_ms / 1000.0)

    print(f"done. ok={ok} fail={fail}", flush=True)


if __name__ == "__main__":
    main()
