import { Client as GeneratedValocracyClient } from '../generated/valocracy/src/index.js';
import type { AssembledTransaction, Result } from '@stellar/stellar-sdk/contract';
import type { u64 } from '@stellar/stellar-sdk/contract';

export class ValocracyClient {
  private client: GeneratedValocracyClient;

  constructor(
    public readonly networkPassphrase: string,
    public readonly rpcUrl: string,
    public readonly contractId: string
  ) {
    this.client = new GeneratedValocracyClient({
      networkPassphrase,
      rpcUrl,
      contractId,
    });
  }


  async getLevel(address: string): Promise<number> {
    const tx = await this.client.level_of({ account: address });
    return Number(tx.result);
  }

  // Get voting power (Mana) with decay

  async getMana(address: string): Promise<number> {
    const tx = await this.client.get_votes({ account: address });
    return Number(tx.result);
  }

  // Self-register with backend signature

  async selfRegister(
    caller: string,
    signature: Buffer,
    nonce: bigint,
    expiry: bigint
  ): Promise<AssembledTransaction<Result<u64>>> {
    return await this.client.self_register({
      caller,
      signature,
      nonce: BigInt(nonce),
      expiry: BigInt(expiry),
    });
  }
}
