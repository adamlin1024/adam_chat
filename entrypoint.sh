#!/bin/sh

# VoceChat on internal port 3001 (API only)
# Caddy on port 3000 (serves our custom frontend, proxies /api to VoceChat)

echo "Starting VoceChat on port 3001..."
export PORT=3001
cd /home/vocechat-server
./vocechat-server &

echo "Starting Caddy on port 3000..."
caddy run --config /etc/caddy/Caddyfile &

echo "=== Services started ==="
echo "  Caddy  (custom frontend) -> :3000"
echo "  VoceChat (API backend)   -> :3001"

wait
