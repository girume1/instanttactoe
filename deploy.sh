#!/bin/bash
set -e

echo "🚀 Building InstantTacToe..."
cargo update -p async-graphql --precise 7.0.17
cargo update -p async-graphql-derive --precise 7.0.17
cargo update -p async-graphql-parser --precise 7.0.17
cargo update -p async-graphql-value --precise 7.0.17
cargo build --release --target wasm32-unknown-unknown --package game

echo "✅ Linera wallet initialized."
linera wallet init --faucet https://faucet.testnet-conway.linera.net
linera wallet request-chain --faucet https://faucet.testnet-conway.linera.net

echo "📦 Deploying to Linera..."
linera publish-module \
  target/wasm32-unknown-unknown/release/game_contract.wasm \
  target/wasm32-unknown-unknown/release/game_service.wasm

echo "🎉 Done! Start the service:"
echo "   linera service --port 8080"
echo ""
echo "📱 Then start frontend:"
echo "   cd frontend && npm run dev"