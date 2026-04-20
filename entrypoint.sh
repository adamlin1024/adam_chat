#!/bin/sh
set -e

# Copy custom frontend to data volume on every deploy
mkdir -p /data/wwwroot
cp -rf /app/default-wwwroot/. /data/wwwroot/

# Start VoceChat server
exec /app/vocechat-server -d /data
