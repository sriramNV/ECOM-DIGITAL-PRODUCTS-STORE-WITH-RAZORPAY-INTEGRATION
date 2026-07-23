#!/bin/sh
set -e

echo "Running database migrations with local Prisma..."
pnpm --filter web exec prisma db push --accept-data-loss 2>&1

echo "Starting Next.js..."
pnpm start
