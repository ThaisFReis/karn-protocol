import { useKarn } from '../providers/KarnProvider';
import { ValocracyClient } from '../../clients/ValocracyClient';

export const useValocracy = (): ValocracyClient => {
  const { valocracy } = useKarn();
  return valocracy;
};
