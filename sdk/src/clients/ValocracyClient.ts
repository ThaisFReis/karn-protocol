import { Client as GeneratedValocracyClient } from '../generated/valocracy/src/index.js';
import type { AssembledTransaction } from '@stellar/stellar-sdk/contract';
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

  /**
   * Get the current raw level of an account (without decay)
   * @param address - The account address to query
   * @returns The raw level as a number
   */
  async getLevel(address: string): Promise<number> {
    const tx = await this.client.level_of({ account: address });
    // AssembledTransaction has a `result` property after simulation (which happens by default)
    return Number(tx.result);
  }

  /**
   * Get the current voting power (Mana) with decay applied
   * @param address - The account address to query
   * @returns The current Mana (voting power) as a number
   */
  async getMana(address: string): Promise<number> {
    const tx = await this.client.get_votes({ account: address });
    return Number(tx.result);
  }

  /**
   * Self-register using backend signature
   * @param caller - The caller's address
   * @param signature - Ed25519 signature from backend
   * @param nonce - Unique nonce to prevent replay
   * @param expiry - Signature expiration timestamp
   * @returns AssembledTransaction that needs to be signed and sent
   */
  async selfRegister(
    caller: string,
    signature: Buffer,
    nonce: bigint,
    expiry: bigint
  ): Promise<AssembledTransaction<u64>> {
    return await this.client.self_register({
      caller,
      signature,
      nonce: BigInt(nonce),
      expiry: BigInt(expiry),
    });
  }
}
