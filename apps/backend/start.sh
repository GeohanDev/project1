#!/bin/sh
set -e

echo "[start] Running prisma db push..."
pnpm -C /app/apps/backend run db:push

echo "[start] Running seed..."
pnpm -C /app/apps/backend run db:seed

echo "[start] Starting server..."
exec node /app/apps/backend/dist/index.js
