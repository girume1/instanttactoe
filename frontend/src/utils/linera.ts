import { LineraWallet, Operation } from '@linera-io/wallet';

const CONTRACT_ID = process.env.REACT_APP_CONTRACT_ID || '7f7edacbbbf55f44ffe0a4d939a816145b2093f072f9c3668ff6d509c755114a';

class LineraGameClient {
  private wallet: LineraWallet | null = null;

  async connect(): Promise<boolean> {
    try {
      if (typeof window.linera === 'undefined') {
        throw new Error('Linera wallet not found');
      }
      
      this.wallet = new LineraWallet();
      await this.wallet.connect();
      return true;
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      return false;
    }
  }

  async executeOperation(operation: any): Promise<any> {
    if (!this.wallet) throw new Error('Wallet not connected');
    
    const op: Operation = {
      contractId: CONTRACT_ID,
      operation: JSON.stringify(operation)
    };
    
    return await this.wallet.executeOperation(op);
  }

  async query(query: any): Promise<any> {
    if (!this.wallet) throw new Error('Wallet not connected');
    
    const response = await this.wallet.queryService(CONTRACT_ID, JSON.stringify(query));
    return JSON.parse(response);
  }

  getAddress(): string | null {
    return this.wallet?.getAddress() || null;
  }

  async getBalance(): Promise<number> {
    if (!this.wallet) return 0;
    // In reality, this would query the token balance
    const response = await this.query({ type: 'GetPlayerBalance', player: this.getAddress() });
    return response.balance || 0;
  }
}

export const lineraClient = new LineraGameClient();