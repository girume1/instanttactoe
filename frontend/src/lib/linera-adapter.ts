import { initSync, Client, Wallet, Faucet, Application } from "@linera/client";
import type { Wallet as DynamicWallet } from "@dynamic-labs/sdk-react-core";
import { DynamicSigner } from "./dynamic-signer";

export interface LineraProvider {
  client: Client;
  wallet: Wallet;
  faucet: Faucet;
  address: string;
  chainId: string;
}

const CHAIN_ID_KEY = "linera_chain_id";

export class LineraAdapter {
  private static instance: LineraAdapter | null = null;
  private provider: LineraProvider | null = null;
  private application: Application | null = null;
  private wasmInitPromise: Promise<void> | null = null;
  private connectPromise: Promise<LineraProvider> | null = null;
  private onConnectionChange?: () => void;

  private constructor() {}

  static getInstance(): LineraAdapter {
    if (!LineraAdapter.instance) LineraAdapter.instance = new LineraAdapter();
    return LineraAdapter.instance;
  }

  async connect(
    dynamicWallet: DynamicWallet,
    rpcUrl: string,
    preferredChainId?: string
  ): Promise<LineraProvider> {
    if (this.provider) return this.provider;
    if (this.connectPromise) return this.connectPromise;

    if (!dynamicWallet) throw new Error("Dynamic wallet is required for Linera connection");

    try {
      this.connectPromise = (async () => {
        const { address } = dynamicWallet;
        console.log("🔗 Connecting with Dynamic wallet:", address);

        // 1) Initialize WASM once
        if (!this.wasmInitPromise) {
          this.wasmInitPromise = (async () => {
            const wasmBuffer = await fetch("/linera_bg.wasm").then((r) => r.arrayBuffer());
            initSync({ module: wasmBuffer });
            console.log("✅ Linera WASM initialized via initSync");
          })();
        }
        await this.wasmInitPromise;

        // 2) Faucet + wallet
        const faucet = new Faucet(rpcUrl);
        const wallet = await faucet.createWallet();

        // 3) Signer + owner (correct type)
        const signer = new DynamicSigner(dynamicWallet);
        const owner = await signer.address();

        // 4) Choose chain
        let chainId = preferredChainId || localStorage.getItem(CHAIN_ID_KEY);

        // If no chain configured, claim one once and cache it
        if (!chainId) {
          chainId = await faucet.claimChain(wallet, owner);
          localStorage.setItem(CHAIN_ID_KEY, chainId);
          console.log("✅ Claimed new chain:", chainId);
        } else {
          console.log("✅ Using chain:", chainId);
        }

        // 5) Client
        const client = new Client(wallet, signer);
        console.log("✅ Linera client created successfully");

        this.provider = { client, wallet, faucet, chainId, address };
        this.onConnectionChange?.();
        return this.provider;
      })();

      return await this.connectPromise;
    } catch (error) {
      console.error("Failed to connect to Linera:", error);
      throw new Error(
        `Failed to connect to Linera network: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      this.connectPromise = null;
    }
  }

  async setApplication(appId: string) {
    if (!this.provider) throw new Error("Not connected to Linera");
    if (!appId) throw new Error("Application ID is required");

    const frontend = (this.provider.client as any).frontend();
    this.application = await frontend.application(appId);

    console.log("✅ Linera application set!");
    this.onConnectionChange?.();
  }

  getApplication(): Application {
    if (!this.application) throw new Error("Application not set");
    return this.application;
  }

  isChainConnected(): boolean {
    return this.provider !== null;
  }
  isApplicationSet(): boolean {
    return this.application !== null;
  }
  isReady(): boolean {
    return this.isChainConnected() && this.isApplicationSet();
  }

  onConnectionStateChange(callback: () => void): void {
    this.onConnectionChange = callback;
  }
  offConnectionStateChange(): void {
    this.onConnectionChange = undefined;
  }

  reset(): void {
    this.application = null;
    this.provider = null;
    this.connectPromise = null;
    this.onConnectionChange?.();
  }
}

export const lineraAdapter = LineraAdapter.getInstance();
