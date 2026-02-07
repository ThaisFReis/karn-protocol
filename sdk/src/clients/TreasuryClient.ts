import { Client as GeneratedTreasuryClient, Result } from '../generated/treasury/src';
import { AssembledTransaction } from '@stellar/stellar-sdk/contract';

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

  async getClaimableBalance(account: string): Promise<bigint> {
    const { result } = await this.client.get_claimable_balance({ account });
    return result;
  }
}
