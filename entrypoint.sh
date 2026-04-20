#!/bin/sh
set -e

DATA_DIR="/home/vocechat/data"
mkdir -p "$DATA_DIR/wwwroot"
cp -rf /app/default-wwwroot/. "$DATA_DIR/wwwroot/"

# Find vocechat-server binary
SERVER=$(which vocechat-server 2>/dev/null \
  || find / -maxdepth 4 -name "vocechat-server" -type f 2>/dev/null | head -1)

if [ -z "$SERVER" ]; then
  echo "ERROR: vocechat-server binary not found. Contents of /:"
  ls /
  exit 1
fi

echo "Starting: $SERVER -d $DATA_DIR"
exec "$SERVER" -d "$DATA_DIR"
