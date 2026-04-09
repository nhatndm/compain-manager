#!/usr/bin/env bash
set -e

echo "Installing dependencies..."
pnpm install

echo "Building schemas..."
pnpm --filter @repo/schemas build

echo "Running database migrations..."
pnpm --filter @repo/api db:migrate

echo ""
echo "Setup is done. You can run 'pnpm run dev' to run the project locally."
