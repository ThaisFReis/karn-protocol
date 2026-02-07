import { Client as GeneratedGovernorClient } from '../generated/governor/src/index.js';

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
    const tx = await this.client.get_proposal({ proposal_id: BigInt(proposalId) });
    return tx.result;
  }
}
