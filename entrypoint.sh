#!/bin/sh
set -e

DATA_DIR="/home/vocechat/data"
CONFIG_FILE="/home/vocechat/config.toml"

mkdir -p "$DATA_DIR/wwwroot"
cp -rf /app/default-wwwroot/. "$DATA_DIR/wwwroot/"

# Find sample config in image
echo "=== Searching for sample configs ==="
find / -name "*.toml" -type f 2>/dev/null || true
find /home/vocechat-server -type f 2>/dev/null || true

echo "=== Binary help ==="
/home/vocechat-server/vocechat-server --help 2>&1 || true

echo "=== Exiting for inspection ==="
exit 1
