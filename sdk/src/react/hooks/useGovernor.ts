import { useState, useEffect } from 'react';
import { useKarn } from '../providers/KarnProvider.js';

export interface Proposal {
  id: bigint;
  proposer: string;
  description: string;
  votesFor: bigint;
  votesAgainst: bigint;
  startTime: bigint;
  endTime: bigint;
  executed: boolean;
  // Add other proposal fields as needed
}

export interface UseGovernorResult {
  proposal: Proposal | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * React hook to fetch Governor contract proposal data
 *
 * @param proposalId - The proposal ID to query (optional)
 * @returns Object containing proposal data, loading state, and refetch function
 *
 * @example
 * ```tsx
 * function ProposalDetails({ proposalId }) {
 *   const { proposal, isLoading, error } = useGovernor(proposalId);
 *
 *   if (isLoading) return <div>Loading proposal...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *   if (!proposal) return <div>No proposal found</div>;
 *
 *   return (
 *     <div>
 *       <h2>Proposal #{proposal.id.toString()}</h2>
 *       <p>{proposal.description}</p>
 *       <p>Votes For: {proposal.votesFor.toString()}</p>
 *       <p>Votes Against: {proposal.votesAgainst.toString()}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useGovernor(proposalId?: bigint): UseGovernorResult {
  const { governor } = useKarn();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    if (proposalId === undefined) {
      setProposal(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const proposalData = await governor.getProposal(proposalId);
      setProposal(proposalData as Proposal);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch proposal data');
      setError(error);
      console.error('useGovernor error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [proposalId?.toString()]); // Re-fetch when proposalId changes

  return {
    proposal,
    isLoading,
    error,
    refetch: fetchData,
  };
}
