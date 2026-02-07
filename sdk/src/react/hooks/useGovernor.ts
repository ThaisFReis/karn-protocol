import { useKarn } from '../providers/KarnProvider';
import { GovernorClient } from '../../clients/GovernorClient';

export const useGovernor = (): GovernorClient => {
  const { governor } = useKarn();
  return governor;
};
