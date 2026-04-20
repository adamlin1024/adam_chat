#!/bin/sh
set -e

DATA_DIR="/home/vocechat/data"
CONFIG_FILE="/home/vocechat/config.toml"

mkdir -p "$DATA_DIR/wwwroot"
cp -rf /app/default-wwwroot/. "$DATA_DIR/wwwroot/"

# Generate config file
cat > "$CONFIG_FILE" << EOF
[network]
bind = "0.0.0.0:3000"

[system]
data_dir = "$DATA_DIR"
EOF

SERVER="/home/vocechat-server/vocechat-server"
echo "Starting: $SERVER $CONFIG_FILE"
exec "$SERVER" "$CONFIG_FILE"
