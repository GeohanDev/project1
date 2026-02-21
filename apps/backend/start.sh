#!/bin/sh
set -e

echo "[start] Running prisma migrate deploy..."
pnpm -C /app/apps/backend run db:migrate

echo "[start] Running seed..."
pnpm -C /app/apps/backend run db:seed

echo "[start] Starting server..."
exec node /app/apps/backend/dist/index.js
