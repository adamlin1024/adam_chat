# Stage 1: Build custom frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /build
RUN npm install -g pnpm@10.14.0
COPY vocechat-web/package.json vocechat-web/pnpm-lock.yaml ./
COPY vocechat-web/patches/ ./patches/
RUN pnpm install --frozen-lockfile
COPY vocechat-web/ .
ENV REACT_APP_BUILD_TIME=0
ENV REACT_APP_RELEASE=true
ENV GENERATE_SOURCEMAP=false
RUN node scripts/build.js

# Stage 2: Get Caddy static binary (fully static Go binary, no deps needed)
FROM caddy:2 AS caddy-source

# Stage 3: 取得 sqlite3 CLI（用來在 entrypoint 時做一次性 DB 維護 / 殭屍紀錄清理）
# privoce/vocechat-server:latest 是 distroless-ish minimal image，無 apt 也沒有 libsqlite，
# 必須從別的 stage 把 binary + 所需 .so 都複製進去。
FROM debian:bookworm-slim AS sqlite-source
RUN apt-get update && apt-get install -y --no-install-recommends sqlite3 && rm -rf /var/lib/apt/lists/*

# Stage 4: VoceChat server + Caddy reverse proxy + sqlite3
FROM privoce/vocechat-server:latest
COPY --from=caddy-source /usr/bin/caddy /usr/bin/caddy
COPY --from=frontend-builder /build/build /app/wwwroot
COPY --from=sqlite-source /usr/bin/sqlite3 /usr/bin/sqlite3
COPY --from=sqlite-source /usr/lib/x86_64-linux-gnu/libsqlite3.so.0 /usr/lib/x86_64-linux-gnu/libsqlite3.so.0
COPY --from=sqlite-source /usr/lib/x86_64-linux-gnu/libsqlite3.so.0.8.6 /usr/lib/x86_64-linux-gnu/libsqlite3.so.0.8.6
COPY --from=sqlite-source /lib/x86_64-linux-gnu/libreadline.so.8 /lib/x86_64-linux-gnu/libreadline.so.8
COPY --from=sqlite-source /lib/x86_64-linux-gnu/libtinfo.so.6 /lib/x86_64-linux-gnu/libtinfo.so.6
COPY --from=sqlite-source /lib/x86_64-linux-gnu/libz.so.1 /lib/x86_64-linux-gnu/libz.so.1
COPY Caddyfile /etc/caddy/Caddyfile
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
