import { rpc } from '@stellar/stellar-sdk';

export interface PollingOptions {
  /**
   * Maximum number of polling attempts
   * @default 30
   */
  maxAttempts?: number;

  /**
   * Interval between polling attempts in milliseconds
   * @default 1000 (1 second)
   */
  intervalMs?: number;

  /**
   * Whether to use exponential backoff
   * @default true
   */
  exponentialBackoff?: boolean;

  /**
   * Maximum interval between attempts when using exponential backoff (ms)
   * @default 10000 (10 seconds)
   */
  maxIntervalMs?: number;

  /**
   * Callback function called on each polling attempt
   */
  onAttempt?: (attempt: number, status: string) => void;
}

export interface PollingResult<T> {
  /**
   * Whether the operation succeeded
   */
  success: boolean;

  /**
   * The final transaction response (if successful)
   */
  response?: T;

  /**
   * Error message (if failed)
   */
  error?: string;

  /**
   * Number of attempts made
   */
  attempts: number;

  /**
   * Total time elapsed in milliseconds
   */
  elapsedMs: number;
}

/**
 * Poll for a transaction result with exponential backoff
 *
 * @param server - Stellar RPC server instance
 * @param transactionHash - The transaction hash to poll for
 * @param options - Polling configuration options
 * @returns Promise resolving to polling result
 *
 * @example
 * ```typescript
 * import { rpc } from '@stellar/stellar-sdk';
 * import { pollTransactionResult } from '@karn/protocol-sdk';
 *
 * const server = new rpc.Server('https://soroban-testnet.stellar.org');
 * const result = await pollTransactionResult(server, txHash, {
 *   maxAttempts: 30,
 *   intervalMs: 1000,
 *   onAttempt: (attempt, status) => console.log(`Attempt ${attempt}: ${status}`)
 * });
 *
 * if (result.success) {
 *   console.log('Transaction succeeded!', result.response);
 * } else {
 *   console.error('Transaction failed:', result.error);
 * }
 * ```
 */
export async function pollTransactionResult(
  server: rpc.Server,
  transactionHash: string,
  options: PollingOptions = {}
): Promise<PollingResult<rpc.Api.GetTransactionResponse>> {
  const {
    maxAttempts = 30,
    intervalMs = 1000,
    exponentialBackoff = true,
    maxIntervalMs = 10000,
    onAttempt,
  } = options;

  const startTime = Date.now();
  let attempts = 0;
  let currentInterval = intervalMs;

  while (attempts < maxAttempts) {
    attempts++;

    try {
      const response = await server.getTransaction(transactionHash);

      const status = response.status as string;
      onAttempt?.(attempts, status);

      // SUCCESS - Transaction confirmed
      if (response.status === rpc.Api.GetTransactionStatus.SUCCESS) {
        return {
          success: true,
          response,
          attempts,
          elapsedMs: Date.now() - startTime,
        };
      }

      // FAILED - Transaction failed permanently
      if (response.status === rpc.Api.GetTransactionStatus.FAILED) {
        return {
          success: false,
          error: `Transaction failed: ${JSON.stringify(response)}`,
          attempts,
          elapsedMs: Date.now() - startTime,
        };
      }

      // NOT_FOUND - Still pending, continue polling
      if (response.status === rpc.Api.GetTransactionStatus.NOT_FOUND) {
        // Wait before next attempt
        if (attempts < maxAttempts) {
          await sleep(currentInterval);

          // Exponential backoff: double interval each time, up to max
          if (exponentialBackoff) {
            currentInterval = Math.min(currentInterval * 2, maxIntervalMs);
          }
        }
        continue;
      }

      // Unknown status (shouldn't reach here, but handle gracefully)
      return {
        success: false,
        error: `Unknown transaction status: ${status}`,
        attempts,
        elapsedMs: Date.now() - startTime,
      };
    } catch (err) {
      // Network error or RPC error
      if (attempts >= maxAttempts) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error during polling',
          attempts,
          elapsedMs: Date.now() - startTime,
        };
      }

      // Retry on error
      await sleep(currentInterval);
      if (exponentialBackoff) {
        currentInterval = Math.min(currentInterval * 2, maxIntervalMs);
      }
    }
  }

  // Max attempts reached
  return {
    success: false,
    error: `Transaction polling timed out after ${attempts} attempts (${Date.now() - startTime}ms)`,
    attempts,
    elapsedMs: Date.now() - startTime,
  };
}

/**
 * Wait for a specified duration
 *
 * @param ms - Duration to wait in milliseconds
 * @returns Promise that resolves after the duration
 *
 * @example
 * ```typescript
 * await sleep(1000); // Wait 1 second
 * ```
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Poll for multiple transactions in parallel
 *
 * @param server - Stellar RPC server instance
 * @param transactionHashes - Array of transaction hashes to poll
 * @param options - Polling configuration options
 * @returns Promise resolving to array of polling results
 *
 * @example
 * ```typescript
 * const results = await pollMultipleTransactions(server, [hash1, hash2, hash3], {
 *   maxAttempts: 20,
 *   intervalMs: 2000
 * });
 *
 * const allSucceeded = results.every(r => r.success);
 * console.log(`${results.filter(r => r.success).length}/${results.length} succeeded`);
 * ```
 */
export async function pollMultipleTransactions(
  server: rpc.Server,
  transactionHashes: string[],
  options: PollingOptions = {}
): Promise<PollingResult<rpc.Api.GetTransactionResponse>[]> {
  return Promise.all(
    transactionHashes.map((hash) => pollTransactionResult(server, hash, options))
  );
}
