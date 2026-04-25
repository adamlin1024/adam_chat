#!/bin/sh

INTERNAL_PORT=3001
CONFIG="/home/vocechat-server/config/config.toml"

echo "=== Patching VoceChat config to port $INTERNAL_PORT ==="
if [ -f "$CONFIG" ]; then
    sed -i "s/0\.0\.0\.0:[0-9]*/0.0.0.0:${INTERNAL_PORT}/" "$CONFIG"
    echo "Config network section:"
    grep -A2 "\[network\]" "$CONFIG" || grep "bind" "$CONFIG" || echo "(no bind line found)"
else
    echo "WARNING: config not found at $CONFIG"
fi

# === DB sweep：刪掉 vocechat 的 files 表中沒有對應實體檔案的「殭屍紀錄」===
# 背景：vocechat 的「一鍵清除（檔案）」與內建自動過期清理只刪 /upload 下的實體檔，
# 不會動 SQLite 的 files 表，造成檔案頁仍列出殭屍卡片。
# 在每次冷啟動把 mid → content 對照表掃一次，硬碟不存在的就從 DB 刪。
DB="/home/vocechat-server/data/db/db.sqlite"
UPLOAD_DIR="/home/vocechat-server/data/upload/file"
if [ -f "$DB" ] && command -v sqlite3 >/dev/null 2>&1; then
    echo "=== Sweeping zombie file records from $DB ==="
    BEFORE=$(sqlite3 "$DB" "SELECT COUNT(*) FROM files" 2>/dev/null || echo "?")
    ZOMBIES=$(sqlite3 -separator "$(printf '\t')" "$DB" "SELECT mid, content FROM files" 2>/dev/null | \
        while IFS="$(printf '\t')" read -r mid content; do
            [ -n "$content" ] && [ ! -f "$UPLOAD_DIR/$content" ] && echo "$mid"
        done | paste -sd, -)
    if [ -n "$ZOMBIES" ]; then
        sqlite3 "$DB" "DELETE FROM files WHERE mid IN ($ZOMBIES)" 2>/dev/null
        AFTER=$(sqlite3 "$DB" "SELECT COUNT(*) FROM files" 2>/dev/null || echo "?")
        echo "DB sweep: $BEFORE → $AFTER (removed $(echo "$ZOMBIES" | tr ',' '\n' | wc -l) zombies)"
    else
        echo "DB sweep: $BEFORE rows, no zombies found"
    fi
else
    echo "DB sweep: skipped (db or sqlite3 not available)"
fi

echo "Starting VoceChat on port $INTERNAL_PORT..."
cd /home/vocechat-server
./vocechat-server &

echo "Starting Caddy on port 3000..."
caddy run --config /etc/caddy/Caddyfile &

echo "=== Done: Caddy(3000 public) -> VoceChat(3001 internal) ==="
wait
