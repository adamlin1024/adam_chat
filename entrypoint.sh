#!/bin/sh

# nginx serves our custom frontend on port 3000 (external)
# VoceChat runs on port 3001 (internal, api-only)

echo "=== Patching VoceChat to use internal port 3001 ==="
# VoceChat reads PORT env var
export PORT=3001

cd /home/vocechat-server
echo "Starting VoceChat on port 3001..."
./vocechat-server &
VOCECHAT_PID=$!

echo "Starting nginx on port 3000..."
mkdir -p /tmp/client_body /tmp/proxy
nginx -g 'daemon off;' &
NGINX_PID=$!

echo "=== All services started ==="
echo "  nginx  (custom frontend) -> :3000"
echo "  VoceChat (API backend)   -> :3001"

wait $VOCECHAT_PID
