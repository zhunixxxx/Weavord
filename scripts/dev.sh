#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

PIDS=()

cleanup() {
  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
  wait 2>/dev/null || true
}

trap cleanup EXIT INT TERM

echo "→ 后端 API   http://localhost:3001"
npm run dev --prefix server &
PIDS+=($!)

echo "→ 前端页面   http://localhost:5173"
npm run dev --prefix client &
PIDS+=($!)

echo ""
echo "按 Ctrl+C 停止全部服务"
echo ""

# 任一子进程退出时，停止其余进程并返回相同退出码
wait -n
EXIT_CODE=$?
echo ""
echo "服务已退出（code: ${EXIT_CODE}）。若后端报错 better-sqlite3，请运行："
echo "  npm rebuild better-sqlite3 --prefix server"
exit "$EXIT_CODE"
