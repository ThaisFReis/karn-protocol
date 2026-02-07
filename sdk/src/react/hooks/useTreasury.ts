import { useState, useEffect } from 'react';
import { useKarn } from '../providers/KarnProvider.js';

export interface UseTreasuryResult {
  claimableBalance: bigint | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * React hook to fetch Treasury contract data for a member
 *
 * @param member - The member address to query (optional)
 * @returns Object containing claimable balance, loading state, and refetch function
 */


export function useTreasury(member?: string): UseTreasuryResult {
  const { treasury } = useKarn();
  const [claimableBalance, setClaimableBalance] = useState<bigint | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    if (!member) {
      setClaimableBalance(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const balance = await treasury.getClaimableBalance(member);
      setClaimableBalance(balance);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch treasury data');
      setError(error);
      console.error('useTreasury error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [member]);

  return {
    claimableBalance,
    isLoading,
    error,
    refetch: fetchData,
  };
}
