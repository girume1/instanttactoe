import { initialize, Faucet, Client, Wallet, Application } from "@linera/client";
import type { Wallet as DynamicWallet } from "@dynamic-labs/sdk-react-core";
import { DynamicSigner } from "./dynamic-signer";
import { LINERA_RPC_URL, CONTRACT_APP_ID } from "../constants";

type GetPlayerBalanceResponse = {
  balance?: number;
};

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
  private wasmInitPromise: Promise<unknown> | null = null;
  private connectPromise: Promise<LineraProvider> | null = null;
  private onConnectionChange?: () => void;

  private constructor() {}

  static getInstance(): LineraAdapter {
    if (!LineraAdapter.instance) LineraAdapter.instance = new LineraAdapter();
    return LineraAdapter.instance;
  }

  async connect(
    dynamicWallet: DynamicWallet,
    rpcUrl?: string
  ): Promise<LineraProvider> {
    if (this.provider) return this.provider;
    if (this.connectPromise) return this.connectPromise;

    if (!dynamicWallet) {
      throw new Error("Dynamic wallet is required for Linera connection");
    }

    try {
      this.connectPromise = (async () => {
        const { address } = dynamicWallet;
        console.log("🔗 Connecting with Dynamic wallet:", address);

        try {
          if (!this.wasmInitPromise) this.wasmInitPromise = initialize();
          await this.wasmInitPromise;
          console.log("✅ Linera WASM modules initialized successfully");
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          if (msg.includes("storage is already initialized")) {
            console.warn(
              "⚠️ Linera storage already initialized; continuing without re-init"
            );
          } else {
            throw e;
          }
        }

        const faucet = await new Faucet(rpcUrl || LINERA_RPC_URL);
        const wallet = await faucet.createWallet();
        const chainId = await faucet.claimChain(wallet, address);

        const signer = await new DynamicSigner(dynamicWallet);
        const client = await new Client(wallet, signer);
        console.log("✅ Linera wallet created successfully!");

        this.provider = {
          client,
          wallet,
          faucet,
          chainId,
          address: dynamicWallet.address,
        };
        console.log("🔄 Notifying connection state change (chain connected)");
        this.onConnectionChange?.();
        return this.provider;
      })();

      const provider = await this.connectPromise;
      return provider;
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

  async setApplication(appId?: string) {
    if (!this.provider) throw new Error("Not connected to Linera");

    const application = await (this.provider.client as any)
      .frontend()
      .application(appId || CONTRACT_APP_ID);

    if (!application) throw new Error("Failed to get application");
    console.log("✅ Linera application set successfully!");
    this.application = application;
    console.log("🔄 Notifying connection state change (app set)");
    this.onConnectionChange?.();
  }

  async queryApplication<T>(query: any): Promise<T> {
  if (!this.application) throw new Error("Application not set");
  const result = await this.application.query(JSON.stringify(query));
  return JSON.parse(result) as T;
}

async executeOperation(operation: any): Promise<any> {
  if (!this.provider) throw new Error("Not connected");
  // Use client implementation if available, otherwise fall back to adapter-level helper
  try {
    const clientAny = this.provider.client as any;
    if (typeof clientAny.executeOperation === 'function') {
      return await clientAny.executeOperation(this.provider.wallet, operation);
    }
  } catch (e) {
    // ignore and try adapter-level fallback
  }

  // If client doesn't expose executeOperation, attempt to call via frontend application
  if (!this.application) throw new Error('Application not set');
  // Many linera client implementations provide a send/execute call on the application
  if (typeof (this.application as any).execute === 'function') {
    return await (this.application as any).execute(this.provider.wallet, operation);
  }

  // Last resort: throw informative error
  throw new Error('executeOperation is not supported by the current Linera client/provider');
}

async getBalance(): Promise<number> {
  const addr = this.address;
  if (!addr) return 0;

  const response = await this.queryApplication<GetPlayerBalanceResponse>({
    type: "GetPlayerBalance",
    player: addr,
  });

  return response?.balance ?? 0;
}


get address(): string | null {
  return this.provider?.address ?? null;
}

get chainId(): string | null {
  return this.provider?.chainId ?? null;
}



  getProvider(): LineraProvider {
    if (!this.provider) throw new Error("Provider not set");
    return this.provider;
  }

  getFaucet(): Faucet {
    if (!this.provider?.faucet) throw new Error("Faucet not set");
    return this.provider.faucet;
  }

  getWallet(): Wallet {
    if (!this.provider?.wallet) throw new Error("Wallet not set");
    return this.provider.wallet;
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

// Export singleton instance
export const lineraAdapter = LineraAdapter.getInstance();