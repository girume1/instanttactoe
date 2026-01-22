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

  /** Connects to Linera with a Dynamic wallet */
  async connect(dynamicWallet: DynamicWallet, rpcUrl: string): Promise<LineraProvider> {
    if (this.provider) return this.provider;
    if (this.connectPromise) return this.connectPromise;

    if (!dynamicWallet) throw new Error("Dynamic wallet is required for Linera connection");

    try {
      this.connectPromise = (async () => {
        const { address } = dynamicWallet;
        console.log("🔗 Connecting with Dynamic wallet:", address);

        // 1️⃣ Initialize WASM if not already
        if (!this.wasmInitPromise) {
          this.wasmInitPromise = (async () => {
            const wasmBuffer = await fetch("/linera_bg.wasm").then(r => r.arrayBuffer());
            initSync({ module: wasmBuffer });
            console.log("✅ Linera WASM initialized via initSync");
          })();
        }
        await this.wasmInitPromise;

        // 2️⃣ Create faucet, wallet, and claim chain
        const faucet = await new Faucet(rpcUrl);
        const wallet = await faucet.createWallet();
        const chainId = await faucet.claimChain(wallet, address);

        // 3️⃣ Create signer and client
        const signer = new DynamicSigner(dynamicWallet);
        const client = new Client(wallet, signer);
        console.log("✅ Linera client created successfully");

        // 4️⃣ Store provider
        this.provider = { client, wallet, faucet, chainId, address };
        this.onConnectionChange?.();
        return this.provider;
      })();

      return await this.connectPromise;
    } catch (error) {
      console.error("Failed to connect to Linera:", error);
      throw new Error(`Failed to connect to Linera network: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      this.connectPromise = null;
    }
  }

  
   setClient(client: Client, address?: string, chainId?: string): void {
  // Clear existing connection if any
  this.reset();
  
  // Create a minimal provider with the external client
  this.provider = {
    client,
    wallet: null as any, // Will be null for external client
    faucet: null as any, // Will be null for external client
    address: address || 'external-client', // Use provided or placeholder
    chainId: chainId || 'external-chain' // Use provided or placeholder
  };
  
  console.log("✅ External Linera client set");
  this.onConnectionChange?.();
}

  /** Set the application (must be called after connect) */
  async setApplication(appId: string) {
    if (!this.provider) throw new Error("Not connected to Linera");
    if (!appId) throw new Error("Application ID is required");

    const frontend = (this.provider.client as any).frontend();
    this.application = await frontend.application(appId);

    console.log("✅ Linera application set!");
    this.onConnectionChange?.();
  }

  /** Set application from an already created application object */
  setApplicationFromApp(app: Application): void {
    this.application = app;
    console.log("✅ Linera application set from external source");
    this.onConnectionChange?.();
  }

  /** Query the application */
  async queryApplication<T>(query: object): Promise<T> {
    if (!this.application) throw new Error("Application not set");
    const result = await this.application.query(JSON.stringify(query));
    return JSON.parse(result) as T;
  }

  /** Getters */
  getProvider(): LineraProvider {
    if (!this.provider) throw new Error("Provider not set");
    return this.provider;
  }
  getWallet(): Wallet {
    if (!this.provider?.wallet) throw new Error("Wallet not set");
    return this.provider.wallet;
  }
  getFaucet(): Faucet {
    if (!this.provider?.faucet) throw new Error("Faucet not set");
    return this.provider.faucet;
  }
  /** Get client directly */
  getClient(): Client {
    if (!this.provider?.client) throw new Error("Client not set");
    return this.provider.client;
  }
  /** Alias for direct client access */
  get client(): Client | null {
    return this.provider?.client || null;
  }
  getApplication(): Application {
    if (!this.application) throw new Error("Application not set");
    return this.application;
  }

  /** Status */
  isChainConnected(): boolean {
    return this.provider !== null;
  }
  isApplicationSet(): boolean {
    return this.application !== null;
  }
  isReady(): boolean {
    return this.isChainConnected() && this.isApplicationSet();
  }

  /** Connection change events */
  onConnectionStateChange(callback: () => void): void {
    this.onConnectionChange = callback;
  }
  offConnectionStateChange(): void {
    this.onConnectionChange = undefined;
  }

  /** Reset the adapter */
  reset(): void {
    this.application = null;
    this.provider = null;
    this.connectPromise = null;
    this.onConnectionChange?.();
  }
}

// Export singleton
export const lineraAdapter = LineraAdapter.getInstance();