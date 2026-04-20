#!/bin/sh

DATA_DIR="/home/vocechat-server/data"
CUSTOM_FRONTEND="/app/default-wwwroot"

cd /home/vocechat-server

# Start VoceChat in background (it will download official webclient)
./vocechat-server &
SERVER_PID=$!

# Wait until VoceChat finishes downloading and extracting (index.html appears)
echo "Waiting for VoceChat to download webclient..."
ELAPSED=0
until [ -f "$DATA_DIR/wwwroot/index.html" ] || [ $ELAPSED -ge 120 ]; do
    sleep 3
    ELAPSED=$((ELAPSED + 3))
done

# Extra buffer for extraction to fully complete
sleep 5

echo "Overlaying custom frontend (keeping official web.vocechat.md5)..."
for item in "$CUSTOM_FRONTEND"/*; do
    fname=$(basename "$item")
    # Preserve the official md5 file so VoceChat won't re-download on next start
    if [ "$fname" != "web.vocechat.md5" ]; then
        cp -rf "$item" "$DATA_DIR/wwwroot/$fname"
    fi
done
echo "Custom frontend overlay complete."

wait $SERVER_PID
