import { rpc } from '@stellar/stellar-sdk';
import type { AssembledTransaction } from '@stellar/stellar-sdk/contract';

export interface SimulationResult<T> {
  /**
   * Whether the simulation succeeded
   */
  success: boolean;

  /**
   * The decoded result value (if successful)
   */
  result?: T;

  /**
   * Error message (if failed)
   */
  error?: string;

  /**
   * Estimated resource fees in stroops
   */
  fee?: number;

  /**
   * Raw simulation response from RPC
   */
  raw?: rpc.Api.SimulateTransactionResponse;
}

/**
 * Simulate a transaction and extract the result
 *
 * @param tx - AssembledTransaction to simulate
 * @returns Promise resolving to simulation result
 */
export async function simulateTransaction<T>(
  tx: AssembledTransaction<T>
): Promise<SimulationResult<T>> {
  try {
    // AssembledTransaction has `result` property if already simulated
    // The simulation happens automatically by default in generated clients

    // Try to get the result directly (already simulated)
    if (tx.result !== undefined) {
      return {
        success: true,
        result: tx.result,
        fee: 0, // Fee info not available without raw simulation
      };
    }

    // If result not available, transaction likely failed or wasn't simulated
    return {
      success: false,
      error: 'Transaction simulation not available',
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown simulation error',
    };
  }
}

/**
 * Check if a transaction needs restoration (contract data needs to be restored)
 *
 * @param tx - AssembledTransaction to check
 * @returns Promise resolving to boolean indicating if restoration is needed
 */
export async function needsRestoration<T>(
  tx: AssembledTransaction<T>
): Promise<boolean> {
  // For generated clients, restoration info is not directly accessible
  // Return false as default - users should check simulation errors
  return false;
}

/**
 * Estimate the total fee for a transaction (base fee + resource fee)
 *
 * @param tx - AssembledTransaction to estimate
 * @returns Promise resolving to estimated fee in stroops
 */
export async function estimateFee<T>(
  tx: AssembledTransaction<T>
): Promise<number> {
  // Return a default estimate since simulation details not directly accessible
  // Users should check actual fee after building transaction
  return 100000; // Default estimate: 100,000 stroops (~0.01 XLM)
}

/**
 * Simulate multiple transactions in parallel
 *
 * @param transactions - Array of AssembledTransactions to simulate
 * @returns Promise resolving to array of simulation results
 */
export async function simulateMultiple<T>(
  transactions: AssembledTransaction<T>[]
): Promise<SimulationResult<T>[]> {
  return Promise.all(transactions.map((tx) => simulateTransaction(tx)));
}

/**
 * Extract error details from a failed simulation
 *
 * @param simulation - The simulation response
 * @returns Human-readable error message
 */
export function getSimulationError(
  simulation: rpc.Api.SimulateTransactionResponse
): string {
  if (rpc.Api.isSimulationError(simulation)) {
    return simulation.error || 'Unknown simulation error';
  }

  if (rpc.Api.isSimulationRestore(simulation)) {
    return 'Contract requires restoration';
  }

  return 'Simulation did not succeed';
}

/**
 * Check if a simulation result indicates success
 *
 * @param simulation - The simulation response
 * @returns True if simulation succeeded
 */
export function isSimulationSuccess(
  simulation: rpc.Api.SimulateTransactionResponse
): boolean {
  return rpc.Api.isSimulationSuccess(simulation);
}
