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

  /**
   * Get proposal details by ID
   * @param proposalId - The proposal ID to query
   * @returns The proposal object with all details
   */
  async getProposal(proposalId: bigint): Promise<any> {
    const tx = await this.client.get_proposal({ proposal_id: BigInt(proposalId) });
    return tx.result;
  }
}
