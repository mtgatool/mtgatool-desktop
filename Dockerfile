# Web build + static SPA server for Railway.
#
# This repo is primarily the Electron desktop app; only the WEB target
# (app.mtgatool.com, including the public /live/<shareId> overlay viewer) is
# server-deployable. This mirrors the old FTP deploy-web.yml build so behaviour
# is identical, then serves the static build as a single-page app.

# ---- build ----
# Full node image (not -slim): its build toolchain (python/make/g++) is what
# some native deps need at `npm install` time, matching the ubuntu CI runner.
FROM node:18 AS build
WORKDIR /app

COPY package*.json ./
# Matches package.json "install:ci".
RUN npm install && npm install @craco/craco

COPY . .
# generateInfo.js -> src/info.json (version/branch/timestamp).
# editPackageWeb.js -> overrides the Electron-relative homepage so the web build
# emits absolute /static/... asset paths; without it deep routes like
# /live/<id> fail to load their assets.
RUN node generateInfo.js && node editPackageWeb.js && npm run build:web

# ---- serve ----
FROM node:18-slim AS serve
WORKDIR /app
RUN npm install -g serve@14
COPY --from=build /app/build ./build
# A minimal package.json with a `start` script so this image serves the SPA
# whether the platform runs the CMD below OR overrides it with `npm start`
# (Railway's default start command for Node services). -s = SPA fallback: any
# unknown path returns index.html so client-side routing (/live/<id>) works.
# Railway injects $PORT.
RUN printf '%s' '{"name":"mtgatool-web","private":true,"scripts":{"start":"serve -s build -l tcp://0.0.0.0:${PORT:-3000}"}}' > package.json
CMD ["npm", "start"]
