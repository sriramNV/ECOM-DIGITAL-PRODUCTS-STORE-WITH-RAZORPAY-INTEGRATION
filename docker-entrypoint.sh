#!/bin/sh
set -e

echo "Running database migrations..."
pnpm --filter web exec prisma db push 2>&1

if [ "$RUN_SEED" = "true" ]; then
  echo "Running seed..."
  pnpm --filter web exec prisma db seed 2>&1
fi

echo "Starting Next.js..."
pnpm start
