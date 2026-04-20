#!/bin/sh
set -e

DATA_DIR="/home/vocechat/data"

mkdir -p "$DATA_DIR/wwwroot"
cp -rf /app/default-wwwroot/. "$DATA_DIR/wwwroot/"

echo "=== Default config contents ==="
cat /home/vocechat-server/config/config.toml

echo "=== Exiting for inspection ==="
exit 1
