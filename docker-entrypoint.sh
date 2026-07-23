#!/bin/sh
set -e

echo "Running database migrations..."
pnpm --filter web exec prisma db push --accept-data-loss 2>&1

echo "Running seed..."
pnpm --filter web exec prisma db seed 2>&1

echo "Starting Next.js..."
pnpm start
