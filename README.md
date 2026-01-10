# InstantTacToe: Real-Time On-Chain Tic-Tac-Toe ⚡

**The first truly real-time on-chain Tic-Tac-Toe experience.** Every move finalizes in **<100ms**, demonstrating the power and speed of **Linera microchains** for low-latency gaming.

Live playable demo →
Source Code → **https://github.com/girume1/instanttactoe**

[![Buildathon Wave 5+](https://img.shields.io/badge/Buildathon-Wave%204%2B-success)](https://linera.io/buildathon)

---

# ⚡ InstantTacToe

[![Linera SDK](https://img.shields.io/badge/Linera-SDK-00ffea)](https://linera.io)
[![Rust](https://img.shields.io/badge/Rust-1.86+-orange)](https://rust-lang.org)
[![WASM](https://img.shields.io/badge/WASM-wasm32--unknown--unknown-blue)](https://webassembly.org)

**Real-time multiplayer Tic-Tac-Toe on Linera microchains with sub-100ms finality illusion.**

> Built for the Linera Buildathon • Neon Cyberpunk UI • On-chain game state

## 🎮 Live Demo

**Testnet Conway Deployment:**
- **Application ID**: `902e6b5dfdcc1b6dfc7c69a05f927e0e49e207b7dc91d93f9b7b2ea834f8bf43`
- **Chain ID**: `e58f07456a370b3795111aad36c2f359aaf25d60b80dff7b338ef14445147c2e`
- **GraphQL Endpoint**: `http://localhost:8080/chains/e58f07456a370b3795111aad36c2f359aaf25d60b80dff7b338ef14445147c2e/applications/902e6b5dfdcc1b6dfc7c69a05f927e0e49e207b7dc91d93f9b7b2ea834f8bf43`

## ✨ Features

✅ **Real-time Gameplay** - Sub-100ms finality illusion  
✅ **Multiplayer** - Join system with turn validation  
✅ **On-chain State** - Full game state on Linera microchains  
✅ **Neon Cyberpunk UI** - Responsive, modern interface  
✅ **GraphQL API** - Complete query interface  
✅ **Linera SDK 0.15.8** - Full SDK compliance  

## 🚀 Quick Start

### Prerequisites
- [Rust](https://rustup.rs/) (1.86+)
- [Linera CLI](https://linera.io/docs/getting-started)
- [Node.js](https://nodejs.org/) (18+)
- [Git](https://git-scm.com/)

### Installation

```bash
# 1. Clone repository
git clone https://github.com/yourusername/instanttactoe.git
cd instanttactoe

# 2. Build WASM contracts
cargo build --release --target wasm32-unknown-unknown --package game

# 3. Initialize Linera wallet
linera wallet init --faucet https://faucet.testnet-conway.linera.net

# 4. Deploy to Testnet Conway
./deploy.sh
