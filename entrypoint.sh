#!/bin/sh

INTERNAL_PORT=3001
CONFIG="/home/vocechat-server/config/config.toml"

echo "=== Patching VoceChat config to port $INTERNAL_PORT ==="
if [ -f "$CONFIG" ]; then
    sed -i "s/0\.0\.0\.0:[0-9]*/0.0.0.0:${INTERNAL_PORT}/" "$CONFIG"
    echo "Config network section:"
    grep -A2 "\[network\]" "$CONFIG" || grep "bind" "$CONFIG" || echo "(no bind line found)"
else
    echo "WARNING: config not found at $CONFIG"
fi

echo "Starting VoceChat on port $INTERNAL_PORT..."
cd /home/vocechat-server
./vocechat-server &

echo "Starting Caddy on port 3000..."
caddy run --config /etc/caddy/Caddyfile &

echo "=== Done: Caddy(3000 public) -> VoceChat(3001 internal) ==="
wait
