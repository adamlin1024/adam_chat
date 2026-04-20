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

# Stage 2: VoceChat server + nginx reverse proxy
FROM privoce/vocechat-server:latest
USER root
RUN apk add --no-cache nginx
COPY --from=frontend-builder /build/build /app/wwwroot
COPY nginx.conf /etc/nginx/nginx.conf
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
