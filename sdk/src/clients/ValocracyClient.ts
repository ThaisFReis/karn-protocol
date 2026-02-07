import { Client as GeneratedValocracyClient } from '../generated/valocracy/src';
import { rpc } from '@stellar/stellar-sdk';
import { AssembledTransaction, Result } from '@stellar/stellar-sdk/contract';

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
   */
  async getLevel(address: string): Promise<number> {
    const tx = await this.client.level_of({ account: address });
    const result = await tx.simulate(); // Force simulation to get result
    if (rpc.Api.isSimulationSuccess(result)) {
        // The generated client usually decodes the result automatically in .signAndSend() or we need to extract it.
        // Actually, AssembledTransaction has a `result` property if simulated?
        // Wait, the generated client returns AssembledTransaction.
        // We can call `tx.result` if we passed `simulate: true` (default).
        // However, `tx.result` might be Result<T> or T.
        // level_of returns u64.
        
        // Let's rely on standard simulation behavior
        const val = result.result.retval; // This is XDR.
        // The generated client helper `simulation` logic usually handles decoding if we use the helper methods.
        
        // Actually, newer generated clients have `await tx` resolving to ...?
        // No, it returns AssembledTransaction.
        // We can simulate and get the value.
        // But for read-only, we just want the value.
        
        // The generated client has a standard way to get read-only data?
        // Usually: const { result } = await client.method();
        // But here it returns AssembledTransaction.
    }
    
    // Newer scaffold-stellar clients:
    // const { result } = await this.client.level_of({ account: address });
    // return Number(result);
    //
    // Let's double check generated code signature.
    // It returns `Promise<AssembledTransaction<u64>>`.
    // AssembledTransaction has `.result`.
    
    const { result: finalResult } = await this.client.level_of({ account: address });
    return Number(finalResult);
  }

  /**
   * Get the current voting power (Mana)
   */
  async getMana(address: string): Promise<number> {
    const { result } = await this.client.get_votes({ account: address });
    return Number(result);
  }

  /**
   * Self-register using backend signature
   */
  async selfRegister(
    caller: string, 
    signature: Buffer, 
    nonce: bigint, 
    expiry: bigint
  ): Promise<AssembledTransaction<Result<bigint>>> {
    return await this.client.self_register({
      caller,
      signature,
      nonce: BigInt(nonce),
      expiry: BigInt(expiry)
    });
  }
}
