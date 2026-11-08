#!/usr/bin/env bash
set -euo pipefail

mkdir -p dist/server
cp sites/worker.js dist/server/index.js
