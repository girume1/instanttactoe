FROM rust:1.86-slim AS builder

WORKDIR /app

# Install dependencies
RUN apt-get update && apt-get install -y \
    clang \
    cmake \
    protobuf-compiler \
    && rm -rf /var/lib/apt/lists/*

# Install wasm target
RUN rustup target add wasm32-unknown-unknown

# Copy workspace files
COPY Cargo.toml Cargo.lock* ./
COPY abi/ ./abi/
COPY game/ ./game/

# Build dependencies first
RUN mkdir -p ./abi/src && echo "fn main() {}" > ./abi/src/lib.rs
RUN mkdir -p ./game/src && echo "fn main() {}" > ./game/src/lib.rs
RUN cargo build --release --target wasm32-unknown-unknown

# Now copy actual source code
COPY . .

# Build the actual project
RUN cargo build --release --target wasm32-unknown-unknown --package game

# Download linera binary
FROM debian:bookworm-slim
WORKDIR /app

# Install linera
RUN apt-get update && apt-get install -y \
    wget \
    curl \
    && rm -rf /var/lib/apt/lists/*

RUN wget -q https://github.com/linera-io/linera-protocol/releases/download/v0.15.8/linera-x86_64-unknown-linux-gnu.tar.gz \
    && tar -xzf linera-x86_64-unknown-linux-gnu.tar.gz -C /usr/local/bin/ \
    && rm linera-x86_64-unknown-linux-gnu.tar.gz \
    && chmod +x /usr/local/bin/linera

COPY --from=builder /app/target/wasm32-unknown-unknown/release/game_contract.wasm .
COPY --from=builder /app/target/wasm32-unknown-unknown/release/game_service.wasm .

CMD ["linera", "service"]