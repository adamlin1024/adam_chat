#!/bin/sh
set -e

# Use the default config's data dir (relative to binary location)
DATA_DIR="/home/vocechat-server/data"
mkdir -p "$DATA_DIR/wwwroot"
cp -rf /app/default-wwwroot/. "$DATA_DIR/wwwroot/"

# Run from binary directory so it finds config/config.toml by default
cd /home/vocechat-server
echo "Starting vocechat-server with default config..."
exec ./vocechat-server
