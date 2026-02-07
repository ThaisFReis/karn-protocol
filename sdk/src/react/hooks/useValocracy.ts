import { useState, useEffect } from 'react';
import { useKarn } from '../providers/KarnProvider.js';

export interface UseValocracyResult {
  level: number | null;
  mana: number | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * React hook to fetch Valocracy contract data for an address
 *
 * @param address - The account address to query (optional)
 * @returns Object containing level, mana, loading state, and refetch function
 *
 * @example
 * ```tsx
 * function Profile() {
 *   const { address } = useWallet();
 *   const { level, mana, isLoading } = useValocracy(address);
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   return <div>Level: {level}, Mana: {mana}</div>;
 * }
 * ```
 */
export function useValocracy(address?: string): UseValocracyResult {
  const { valocracy } = useKarn();
  const [level, setLevel] = useState<number | null>(null);
  const [mana, setMana] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    if (!address) {
      setLevel(null);
      setMana(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch level and mana in parallel
      const [levelResult, manaResult] = await Promise.all([
        valocracy.getLevel(address),
        valocracy.getMana(address),
      ]);

      setLevel(levelResult);
      setMana(manaResult);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch Valocracy data');
      setError(error);
      console.error('useValocracy error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [address]); // Re-fetch when address changes

  return {
    level,
    mana,
    isLoading,
    error,
    refetch: fetchData,
  };
}
