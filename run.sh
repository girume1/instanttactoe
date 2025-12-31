#!/bin/bash

# 1. Build the Contract and Service
echo "🔨 Building Wasm binaries..."
cargo build --release --target wasm32-unknown-unknown

# 2. Publish the Bytecode
echo "🚀 Publishing Bytecode to Linera..."
# We capture the Bytecode ID to use in the next step
BYTECODE_ID=$(linera publish-bytecode \
    target/wasm32-unknown-unknown/release/game_contract.wasm \
    target/wasm32-unknown-unknown/release/game_service.wasm)

echo "✅ Bytecode Published: $BYTECODE_ID"

# 3. Create the Application
echo "🆕 Creating Application instance..."
APP_ID=$(linera create-application $BYTECODE_ID)

echo "------------------------------------------"
echo "🎉 SUCCESS! InstantTacToe is deployed."
echo "APP_ID: $APP_ID"
echo "------------------------------------------"
echo "Next step: Update your frontend/.env.local with:"
echo "NEXT_PUBLIC_LINERA_NODE_URL=http://localhost:8080/applications/$APP_ID"
echo "------------------------------------------"