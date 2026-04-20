#!/bin/sh
set -e

DATA_DIR="/home/vocechat-server/data"
mkdir -p "$DATA_DIR/wwwroot"
cp -rf /app/default-wwwroot/. "$DATA_DIR/wwwroot/"

# Make wwwroot read-only so VoceChat cannot overwrite our custom frontend
chmod -R a-w "$DATA_DIR/wwwroot"

echo "Custom frontend deployed, wwwroot is now read-only."
ls "$DATA_DIR/wwwroot/" | head -5

cd /home/vocechat-server
exec ./vocechat-server
