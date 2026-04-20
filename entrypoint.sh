#!/bin/sh
set -e

DATA_DIR="/home/vocechat/data"
mkdir -p "$DATA_DIR/wwwroot"
cp -rf /app/default-wwwroot/. "$DATA_DIR/wwwroot/"

SERVER="/home/vocechat-server/vocechat-server"

echo "Starting: $SERVER $DATA_DIR"
exec "$SERVER" "$DATA_DIR"
