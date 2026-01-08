#!/bin/bash
set -e

echo "🚀 Building project..."
cargo build --release --target wasm32-unknown-unknown --package game

echo "📦 Checking Linera setup..."
if ! command -v linera &> /dev/null; then
    echo "Linera not found. Please install it first."
    exit 1
fi

# Check if wallet exists
if [ ! -f "$HOME/.local/share/linera/wallet.json" ]; then
    echo "🆕 Initializing new wallet..."
    linera wallet init
fi

echo "🚀 Publishing module..."
WASM_FILES="target/wasm32-unknown-unknown/release/game_contract.wasm target/wasm32-unknown-unknown/release/game_service.wasm"
MODULE_ID=$(linera publish-module $WASM_FILES)

echo "✅ Module Published with ID: $MODULE_ID"

echo "🆕 Creating application instance..."
APP_ID=$(linera create-application "$MODULE_ID")

echo "🎉 Application Created with ID: $APP_ID"
echo ""
echo "🌐 Your application is now live!"
echo "   GraphQL endpoint: http://localhost:8080/graphql"
echo "   Application ID: $APP_ID"
echo ""
echo "📡 Starting Linera service..."
echo "   Press Ctrl+C to stop"
echo ""
linera service