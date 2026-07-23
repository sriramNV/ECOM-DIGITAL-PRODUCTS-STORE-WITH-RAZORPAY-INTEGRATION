#!/bin/sh
set -e

echo "Running database migrations..."
npx prisma db push --accept-data-loss 2>&1

echo "Starting Next.js..."
pnpm start
