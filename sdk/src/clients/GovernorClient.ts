import { Client as GeneratedGovernorClient } from '../generated/governor/src';
import { AssembledTransaction, Result } from '@stellar/stellar-sdk/contract';

export class GovernorClient {
  private client: GeneratedGovernorClient;

  constructor(
    public readonly networkPassphrase: string,
    public readonly rpcUrl: string,
    public readonly contractId: string
  ) {
    this.client = new GeneratedGovernorClient({
      networkPassphrase,
      rpcUrl,
      contractId,
    });
  }

  async getProposal(proposalId: bigint): Promise<any> {
    const { result } = await this.client.get_proposal({ proposal_id: BigInt(proposalId) });
    return result; // Result<Proposal>
  }
}
