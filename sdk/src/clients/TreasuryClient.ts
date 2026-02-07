import { Client as GeneratedTreasuryClient } from '../generated/treasury/src/index.js';

export class TreasuryClient {
  private client: GeneratedTreasuryClient;

  constructor(
    public readonly networkPassphrase: string,
    public readonly rpcUrl: string,
    public readonly contractId: string
  ) {
    this.client = new GeneratedTreasuryClient({
      networkPassphrase,
      rpcUrl,
      contractId,
    });
  }


  async getClaimableBalance(member: string): Promise<bigint> {
    const tx = await this.client.get_claimable_balance({ member });
    return tx.result;
  }
}
