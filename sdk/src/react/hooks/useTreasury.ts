import { useKarn } from '../providers/KarnProvider';
import { TreasuryClient } from '../../clients/TreasuryClient';

export const useTreasury = (): TreasuryClient => {
  const { treasury } = useKarn();
  return treasury;
};
