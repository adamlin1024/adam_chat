"""Import LINE chat export into VoceChat DM.

Flow:
  1. Prompt admin email/password (once per run unless --token provided).
  2. POST /api/token/login to obtain admin bearer token.
  3. GET /api/user/me to discover admin uid (= ADAM).
  4. Ensure bot-api-keys exist for both peers (create if missing, cache to disk).
  5. Parse LINE export, map sender -> (own uid, own api key), target = peer uid.
  6. POST /api/bot/send_to_user/{target_uid} with X-Properties base64 JSON
     carrying original_created_at (ms). Rate-limit with --delay-ms.

Usage examples:
    python import_line.py --dry-run --limit 10
    python import_line.py --limit 20
    python import_line.py --start 20 --limit 100
    python import_line.py          # full import
"""
import argparse
import base64
import getpass
import json
import os
import sys
import time
from pathlib import Path

import requests

from parse_line import parse

DEFAULT_BASE = "https://cat-talk.up.railway.app"
DEFAULT_FILE = r"C:\Users\User\Desktop\Adam_lab\Adam_chat\[LINE] 遊戲與生活交流群的聊天.txt"
CACHE_PATH = Path(__file__).with_name(".import_cache.json")

# Map LINE sender name -> VoceChat uid
SENDER_MAP = {
    "Adamlinooo": None,   # filled from /user/me
    "乃綠": 2,             # Neko
}
# Peer uid (the OTHER side) for each sender
# Adamlinooo -> Neko (uid=2), 乃綠 -> Adam (uid from /user/me)


def log(msg: str):
    print(msg, flush=True)


def api_post(base: str, path: str, *, json_body=None, headers=None, data=None):
    url = f"{base}/api{path}"
    r = requests.post(url, json=json_body, data=data, headers=headers or {}, timeout=30)
    return r


def api_get(base: str, path: str, *, headers=None):
    url = f"{base}/api{path}"
    return requests.get(url, headers=headers or {}, timeout=30)


def login(base: str, email: str, password: str) -> str:
    r = api_post(
        base,
        "/token/login",
        json_body={
            "credential": {"type": "password", "email": email, "password": password},
            "device": "line-import-script",
        },
    )
    r.raise_for_status()
    return r.json()["token"]


def get_me(base: str, token: str) -> dict:
    r = api_get(base, "/user/me", headers={"X-API-Key": token})
    r.raise_for_status()
    return r.json()


def list_bot_keys(base: str, token: str, uid: int) -> list:
    r = api_get(base, f"/admin/user/bot-api-key/{uid}", headers={"X-API-Key": token})
    if r.status_code != 200:
        return []
    return r.json()


def create_bot_key(base: str, token: str, uid: int, name: str) -> str:
    r = api_post(
        base,
        f"/admin/user/bot-api-key/{uid}",
        json_body={"name": name},
        headers={"X-API-Key": token, "Content-Type": "application/json; charset=utf-8"},
    )
    if r.status_code == 409:
        raise RuntimeError(
            f"bot-api-key name already exists for uid={uid}; delete it or use a different name."
        )
    r.raise_for_status()
    # response is a bare string (with quotes as JSON)
    try:
        return r.json()
    except Exception:
        return r.text.strip('"')


def ensure_key(base: str, token: str, uid: int, name: str, cache: dict) -> str:
    ck = f"key_{uid}"
    if ck in cache and cache[ck]:
        return cache[ck]
    keys = list_bot_keys(base, token, uid)
    # existing list shows only metadata; secret is only returned on create.
    # So we always create a new named key (idempotent via name variant).
    existing_names = {k.get("name") for k in keys}
    base_name = name
    suffix = 0
    unique = base_name
    while unique in existing_names:
        suffix += 1
        unique = f"{base_name}_{suffix}"
    log(f"  creating bot-api-key for uid={uid} name='{unique}'")
    key = create_bot_key(base, token, uid, unique)
    cache[ck] = key
    cache[f"key_name_{uid}"] = unique
    CACHE_PATH.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")
    return key


def load_cache() -> dict:
    if CACHE_PATH.exists():
        try:
            return json.loads(CACHE_PATH.read_text(encoding="utf-8"))
        except Exception:
            return {}
    return {}


def send_message(base: str, api_key: str, target_uid: int, content: str, original_ts_ms: int):
    props = {"original_created_at": original_ts_ms}
    x_props = base64.b64encode(json.dumps(props).encode("utf-8")).decode("ascii")
    r = requests.post(
        f"{base}/api/bot/send_to_user/{target_uid}",
        headers={
            "x-api-key": api_key,
            "content-type": "text/plain",
            "X-Properties": x_props,
        },
        data=content.encode("utf-8"),
        timeout=30,
    )
    return r


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base-url", default=DEFAULT_BASE)
    ap.add_argument("--file", default=DEFAULT_FILE)
    ap.add_argument("--limit", type=int, default=0, help="0 = all")
    ap.add_argument("--start", type=int, default=0, help="skip first N messages")
    ap.add_argument("--delay-ms", type=int, default=100)
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--email")
    ap.add_argument("--reset-cache", action="store_true")
    args = ap.parse_args()

    sys.stdout.reconfigure(encoding="utf-8")
    base = args.base_url.rstrip("/")
    log(f"target: {base}")

    messages = parse(args.file)
    log(f"parsed {len(messages)} messages")

    if args.reset_cache and CACHE_PATH.exists():
        CACHE_PATH.unlink()
        log("cache cleared")
    cache = load_cache()

    if args.dry_run:
        window = messages[args.start : (args.start + args.limit if args.limit else None)]
        for i, m in enumerate(window[:10]):
            log(f"  [{i}] ts={m['ts_ms']} sender={m['sender']} -> {m['content'][:50]}")
        log(f"(dry-run) would send {len(window)} messages")
        return

    # Load credentials from .env if present
    env_path = Path(__file__).with_name(".env")
    env_email = None
    env_password = None
    if env_path.exists():
        for ln in env_path.read_text(encoding="utf-8").splitlines():
            ln = ln.strip()
            if not ln or ln.startswith("#") or "=" not in ln:
                continue
            k, v = ln.split("=", 1)
            k = k.strip()
            v = v.strip().strip('"').strip("'")
            if k == "VOCECHAT_EMAIL":
                env_email = v
            elif k == "VOCECHAT_PASSWORD":
                env_password = v

    def do_login():
        email = args.email or env_email or input("admin email: ").strip()
        password = env_password or getpass.getpass("admin password: ")
        log("logging in ...")
        return login(base, email, password)

    # Login (unless token in cache)
    token = cache.get("token")
    if not token:
        token = do_login()
        cache["token"] = token
        CACHE_PATH.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")
    me_resp = api_get(base, "/user/me", headers={"X-API-Key": token})
    if me_resp.status_code != 200:
        log(f"/user/me returned {me_resp.status_code}: {me_resp.text[:200]}")
        cache.pop("token", None)
        token = do_login()
        cache["token"] = token
        me_resp = api_get(base, "/user/me", headers={"X-API-Key": token})
        me_resp.raise_for_status()
    me = me_resp.json()
    adam_uid = me["uid"]
    log(f"logged in as uid={adam_uid} name={me.get('name')}")

    SENDER_MAP["Adamlinooo"] = adam_uid
    peer_of = {adam_uid: 2, 2: adam_uid}

    adam_key = ensure_key(base, token, adam_uid, "import_line_adam", cache)
    neko_key = ensure_key(base, token, 2, "import_line_neko", cache)
    key_of = {adam_uid: adam_key, 2: neko_key}

    # Sanity ping: verify keys work
    test = send_message(base, adam_key, 2, "", 0)  # empty body often 400 but validates auth
    log(f"key sanity ping: HTTP {test.status_code} (any non-401/403 is fine)")

    window = messages[args.start : (args.start + args.limit if args.limit else None)]
    log(f"sending {len(window)} messages (start={args.start}, limit={args.limit or 'all'})")

    ok = 0
    fail = 0
    for i, m in enumerate(window):
        sender = m["sender"]
        if sender not in SENDER_MAP:
            log(f"skip unknown sender {sender}")
            continue
        sender_uid = SENDER_MAP[sender]
        target_uid = peer_of[sender_uid]
        api_key = key_of[sender_uid]
        try:
            r = send_message(base, api_key, target_uid, m["content"], m["ts_ms"])
            if r.status_code >= 400:
                fail += 1
                log(f"  [{i}] HTTP {r.status_code}: {r.text[:150]}")
            else:
                ok += 1
                if i % 50 == 0 or i < 10:
                    log(f"  [{i+1}/{len(window)}] ok sender={sender} -> {m['content'][:40]}")
        except Exception as e:
            fail += 1
            log(f"  [{i}] EXC {e}")
        if args.delay_ms > 0:
            time.sleep(args.delay_ms / 1000.0)

    log(f"done. ok={ok} fail={fail}")


if __name__ == "__main__":
    main()
