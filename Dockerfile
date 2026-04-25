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

# Stage 3: VoceChat server + Caddy reverse proxy
FROM privoce/vocechat-server:latest
COPY --from=caddy-source /usr/bin/caddy /usr/bin/caddy
COPY --from=frontend-builder /build/build /app/wwwroot
COPY Caddyfile /etc/caddy/Caddyfile
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
