#!/bin/sh
set -e

DATA_DIR="/home/vocechat-server/data"
mkdir -p "$DATA_DIR/wwwroot"
cp -rf /app/default-wwwroot/. "$DATA_DIR/wwwroot/"

echo "=== Full default config ==="
cat /home/vocechat-server/config/config.toml
echo ""
echo "=== wwwroot contents ==="
ls "$DATA_DIR/wwwroot/" | head -10

cd /home/vocechat-server
echo "Starting vocechat-server..."
exec ./vocechat-server
