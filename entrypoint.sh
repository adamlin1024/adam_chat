#!/bin/sh
set -e

DATA_DIR="/home/vocechat-server/data"
mkdir -p "$DATA_DIR/wwwroot"
cp -rf /app/default-wwwroot/. "$DATA_DIR/wwwroot/"

# Create VERSION file to prevent VoceChat from re-downloading official webclient
echo "0.0.0-custom" > "$DATA_DIR/wwwroot/VERSION"

# Patch config: set webclient_url to empty to disable auto-download
CONFIG="/home/vocechat-server/config/config.toml"
sed -i 's|^# webclient_url.*|webclient_url = ""|g' "$CONFIG"
sed -i 's|^webclient_url = "http.*|webclient_url = ""|g' "$CONFIG"

echo "=== Config webclient section ==="
grep -A2 "\[webclient\]" "$CONFIG" || true

cd /home/vocechat-server
echo "Starting vocechat-server..."
exec ./vocechat-server
