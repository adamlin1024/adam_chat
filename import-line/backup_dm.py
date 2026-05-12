"""Backup all messages in DM with a peer user (uid=2 by default).

Usage:
    python backup_dm.py              # backup uid=2 -> backup_dm_2.json
    python backup_dm.py --peer 2
"""
import argparse
import json
import sys
from pathlib import Path

import requests

DEFAULT_BASE = "https://cat-talk.up.railway.app"
CACHE_PATH = Path(__file__).with_name(".import_cache.json")


def load_cache():
    if CACHE_PATH.exists():
        return json.loads(CACHE_PATH.read_text(encoding="utf-8"))
    return {}


def save_cache(cache):
    CACHE_PATH.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")


def login_from_env(base):
    env_path = Path(__file__).with_name(".env")
    email = password = None
    if env_path.exists():
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
    if not email or not password:
        raise RuntimeError("missing VOCECHAT_EMAIL/PASSWORD in .env")
    r = requests.post(
        f"{base}/api/token/login",
        json={"credential": {"type": "password", "email": email, "password": password},
              "device": "line-import-script"},
        timeout=30,
    )
    r.raise_for_status()
    return r.json()["token"]


def fetch_history(base, token, peer_uid, before=None, limit=100):
    url = f"{base}/api/user/{peer_uid}/history?limit={limit}"
    if before is not None:
        url += f"&before={before}"
    r = requests.get(url, headers={"X-API-Key": token}, timeout=30)
    r.raise_for_status()
    return r.json()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base-url", default=DEFAULT_BASE)
    ap.add_argument("--peer", type=int, default=2)
    ap.add_argument("--out")
    args = ap.parse_args()

    sys.stdout.reconfigure(encoding="utf-8")
    base = args.base_url.rstrip("/")
    cache = load_cache()
    token = cache.get("token")
    # verify token; re-login if needed
    def ok(tk):
        r = requests.get(f"{base}/api/user/me", headers={"X-API-Key": tk}, timeout=30)
        return r.status_code == 200
    if not token or not ok(token):
        print("logging in ...", flush=True)
        token = login_from_env(base)
        cache["token"] = token
        save_cache(cache)

    out_path = Path(args.out) if args.out else Path(__file__).with_name(f"backup_dm_{args.peer}.json")

    all_msgs = []
    before = None
    while True:
        batch = fetch_history(base, token, args.peer, before=before, limit=100)
        if not batch:
            break
        print(f"  fetched {len(batch)} msgs (before={before})", flush=True)
        all_msgs.extend(batch)
        # history API returns newest first; iterate with `before = oldest mid in batch`
        oldest_mid = min(m["mid"] for m in batch)
        if len(batch) < 100:
            break
        before = oldest_mid

    # sort ascending by mid for easier re-import
    all_msgs.sort(key=lambda m: m["mid"])
    out_path.write_text(json.dumps(all_msgs, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"backed up {len(all_msgs)} messages to {out_path}")
    if all_msgs:
        print(f"  first mid={all_msgs[0]['mid']} created_at={all_msgs[0].get('created_at')}")
        print(f"  last  mid={all_msgs[-1]['mid']} created_at={all_msgs[-1].get('created_at')}")


if __name__ == "__main__":
    main()
