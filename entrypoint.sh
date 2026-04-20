#!/bin/sh
set -e

DATA_DIR="/home/vocechat-server/data"
mkdir -p "$DATA_DIR/wwwroot"
cp -rf /app/default-wwwroot/. "$DATA_DIR/wwwroot/"

echo "Custom frontend deployed."

cd /home/vocechat-server
exec ./vocechat-server
