import { Client as GeneratedTreasuryClient } from '../generated/treasury/src';
import { AssembledTransaction, Result } from '@stellar/stellar-sdk/contract';

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
    const { result } = await this.client.get_claimable_balance({ member });
    return result;
  }
}
