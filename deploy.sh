#!/bin/bash
set -e

APP_DIR="/opt/threejs"
cd "$APP_DIR"

echo "=========================================="
echo "  Deploying Three.js App"
echo "=========================================="

echo "[1/6] Pulling latest code..."
git fetch origin main
git reset --hard origin/main

echo "[2/6] Installing dependencies..."
npm ci --production

echo "[3/6] Building frontend..."
npm run build

echo "[4/6] Creating required directories..."
mkdir -p logs db

echo "[5/6] Setting permissions..."
chmod 600 logs/* 2>/dev/null || true
chmod 600 .env 2>/dev/null || true

echo "[6/6] Restarting PM2..."
pm2 restart ecosystem.config.cjs --env production || pm2 start ecosystem.config.cjs

echo ""
echo "=========================================="
echo "  Deployed: $(git rev-parse --short HEAD)"
echo "  Status:   $(pm2 list | grep threejs-app)"
echo "=========================================="
